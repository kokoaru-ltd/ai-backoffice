import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

// =============================================================================
// Types
// =============================================================================

interface DomainRequest {
  action: string;
  params: Record<string, any>;
}

interface DomainResponse {
  success: boolean;
  message: string;
  data?: any;
}

interface JournalEntry {
  account_id: string;
  debit: number;
  credit: number;
}

// =============================================================================
// CORS & Response helpers
// =============================================================================

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(status: number, body: DomainResponse): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// =============================================================================
// Formatting helpers
// =============================================================================

function formatYen(amount: number): string {
  return `\u00a5${amount.toLocaleString("ja-JP")}`;
}

function formatDateJP(date: string | Date): string {
  const d = new Date(date);
  return `${d.getFullYear()}\u5e74${d.getMonth() + 1}\u6708${d.getDate()}\u65e5`;
}

/** Parse "YYYY-MM" period into start/end dates */
function parsePeriod(period: string): { start: string; end: string } {
  const [year, month] = period.split("-").map(Number);
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const endDate = new Date(year, month, 0); // last day of month
  const end = `${year}-${String(month).padStart(2, "0")}-${String(endDate.getDate()).padStart(2, "0")}`;
  return { start, end };
}

// =============================================================================
// Supabase admin client
// =============================================================================

function getAdminClient(): SupabaseClient {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

// =============================================================================
// Action handlers
// =============================================================================

async function getRevenue(
  db: SupabaseClient,
  params: Record<string, any>,
): Promise<DomainResponse> {
  const { org_id, period } = params;
  if (!org_id || !period) {
    return { success: false, message: "org_id と period は必須です" };
  }

  const { start, end } = parsePeriod(period);

  // Aggregate invoices (receivable, paid)
  const { data: invoices, error: invErr } = await db
    .from("invoices")
    .select("amount, tax_amount")
    .eq("org_id", org_id)
    .eq("type", "receivable")
    .eq("status", "paid")
    .gte("created_at", `${start}T00:00:00`)
    .lte("created_at", `${end}T23:59:59`);

  if (invErr) {
    return { success: false, message: `請求書取得エラー: ${invErr.message}` };
  }

  const invoiceTotal = (invoices || []).reduce(
    (sum: number, inv: any) => sum + Number(inv.amount) + Number(inv.tax_amount),
    0,
  );

  // Aggregate journal revenue entries
  const { data: journals, error: jrnErr } = await db
    .from("journals")
    .select("entries")
    .eq("org_id", org_id)
    .gte("date", start)
    .lte("date", end);

  if (jrnErr) {
    return { success: false, message: `仕訳取得エラー: ${jrnErr.message}` };
  }

  // Get revenue account IDs
  const { data: revenueAccounts } = await db
    .from("accounts")
    .select("id")
    .eq("org_id", org_id)
    .eq("type", "revenue");

  const revenueIds = new Set((revenueAccounts || []).map((a: any) => a.id));

  let journalRevenue = 0;
  for (const j of journals || []) {
    const entries = j.entries as JournalEntry[];
    for (const e of entries) {
      if (revenueIds.has(e.account_id)) {
        journalRevenue += Number(e.credit) - Number(e.debit);
      }
    }
  }

  const total = invoiceTotal + journalRevenue;

  return {
    success: true,
    message: `${period} の売上合計: ${formatYen(total)}`,
    data: {
      period,
      invoice_revenue: invoiceTotal,
      invoice_revenue_formatted: formatYen(invoiceTotal),
      journal_revenue: journalRevenue,
      journal_revenue_formatted: formatYen(journalRevenue),
      total,
      total_formatted: formatYen(total),
      invoice_count: (invoices || []).length,
    },
  };
}

async function getExpenses(
  db: SupabaseClient,
  params: Record<string, any>,
): Promise<DomainResponse> {
  const { org_id, period, user_id } = params;
  if (!org_id || !period) {
    return { success: false, message: "org_id と period は必須です" };
  }

  const { start, end } = parsePeriod(period);

  let query = db
    .from("expenses")
    .select("*")
    .eq("org_id", org_id)
    .gte("created_at", `${start}T00:00:00`)
    .lte("created_at", `${end}T23:59:59`)
    .order("created_at", { ascending: false });

  if (user_id) {
    query = query.eq("user_id", user_id);
  }

  const { data, error } = await query;
  if (error) {
    return { success: false, message: `経費取得エラー: ${error.message}` };
  }

  const expenses = data || [];
  const total = expenses.reduce(
    (sum: number, e: any) => sum + Number(e.amount),
    0,
  );
  const approved = expenses.filter((e: any) => e.status === "approved");
  const pending = expenses.filter((e: any) => e.status === "pending");

  return {
    success: true,
    message: `${period} の経費: ${formatYen(total)}（${expenses.length}件）`,
    data: {
      period,
      expenses: expenses.map((e: any) => ({
        ...e,
        amount_formatted: formatYen(Number(e.amount)),
        created_at_formatted: formatDateJP(e.created_at),
      })),
      summary: {
        total,
        total_formatted: formatYen(total),
        count: expenses.length,
        approved_count: approved.length,
        approved_total: approved.reduce(
          (s: number, e: any) => s + Number(e.amount),
          0,
        ),
        pending_count: pending.length,
        pending_total: pending.reduce(
          (s: number, e: any) => s + Number(e.amount),
          0,
        ),
      },
    },
  };
}

async function createExpense(
  db: SupabaseClient,
  params: Record<string, any>,
): Promise<DomainResponse> {
  const { org_id, user_id, category, amount, description, receipt_url } =
    params;
  if (!org_id || !user_id || !category || amount == null) {
    return {
      success: false,
      message: "org_id, user_id, category, amount は必須です",
    };
  }

  const numAmount = Number(amount);
  if (isNaN(numAmount) || numAmount <= 0) {
    return { success: false, message: "amount は正の数値で指定してください" };
  }

  const AUTO_APPROVE_THRESHOLD = 5000;
  const autoApprove = numAmount < AUTO_APPROVE_THRESHOLD;
  const taxAmount = Math.floor(numAmount * 0.1); // 10% consumption tax

  const { data, error } = await db
    .from("expenses")
    .insert({
      org_id,
      user_id,
      category,
      amount: numAmount,
      tax_amount: taxAmount,
      description: description || null,
      receipt_url: receipt_url || null,
      status: autoApprove ? "approved" : "pending",
      approved_by: autoApprove ? user_id : null,
    })
    .select()
    .single();

  if (error) {
    return { success: false, message: `経費作成エラー: ${error.message}` };
  }

  // If not auto-approved, create an approval request
  if (!autoApprove) {
    await db.from("approval_requests").insert({
      org_id,
      requester_id: user_id,
      domain: "accounting",
      type: "expense_approval",
      data: { expense_id: data.id, amount: numAmount, category, description },
      threshold_amount: numAmount,
    });
  }

  const statusMsg = autoApprove
    ? `自動承認済み（${formatYen(AUTO_APPROVE_THRESHOLD)}未満）`
    : "承認待ち";

  return {
    success: true,
    message: `経費を登録しました: ${formatYen(numAmount)}（${statusMsg}）`,
    data: {
      ...data,
      amount_formatted: formatYen(numAmount),
      tax_amount_formatted: formatYen(taxAmount),
      auto_approved: autoApprove,
    },
  };
}

async function createInvoice(
  db: SupabaseClient,
  params: Record<string, any>,
): Promise<DomainResponse> {
  const { org_id, contact_id, amount, items, due_date } = params;
  if (!org_id || !contact_id || amount == null || !due_date) {
    return {
      success: false,
      message: "org_id, contact_id, amount, due_date は必須です",
    };
  }

  const numAmount = Number(amount);
  if (isNaN(numAmount) || numAmount <= 0) {
    return { success: false, message: "amount は正の数値で指定してください" };
  }

  const taxAmount = Math.floor(numAmount * 0.1);

  const { data, error } = await db
    .from("invoices")
    .insert({
      org_id,
      contact_id,
      type: "receivable",
      amount: numAmount,
      tax_amount: taxAmount,
      status: "draft",
      due_date,
    })
    .select()
    .single();

  if (error) {
    return { success: false, message: `請求書作成エラー: ${error.message}` };
  }

  return {
    success: true,
    message: `請求書を作成しました: ${formatYen(numAmount + taxAmount)}（税込）、期日: ${formatDateJP(due_date)}`,
    data: {
      ...data,
      amount_formatted: formatYen(numAmount),
      tax_amount_formatted: formatYen(taxAmount),
      total_formatted: formatYen(numAmount + taxAmount),
      due_date_formatted: formatDateJP(due_date),
      items: items || [],
    },
  };
}

async function createJournal(
  db: SupabaseClient,
  params: Record<string, any>,
): Promise<DomainResponse> {
  const { org_id, date, description, entries, created_by } = params;
  if (!org_id || !date || !entries || !Array.isArray(entries)) {
    return {
      success: false,
      message: "org_id, date, entries（配列）は必須です",
    };
  }

  if (entries.length === 0) {
    return { success: false, message: "仕訳明細が空です" };
  }

  // Double-entry bookkeeping validation: total debits must equal total credits
  let totalDebit = 0;
  let totalCredit = 0;
  for (const entry of entries) {
    if (!entry.account_id) {
      return {
        success: false,
        message: "各仕訳明細に account_id が必要です",
      };
    }
    totalDebit += Number(entry.debit || 0);
    totalCredit += Number(entry.credit || 0);
  }

  // Allow floating point tolerance
  if (Math.abs(totalDebit - totalCredit) > 0.01) {
    return {
      success: false,
      message: `借方合計（${formatYen(totalDebit)}）と貸方合計（${formatYen(totalCredit)}）が一致しません。複式簿記の原則に従い、借方と貸方を一致させてください。`,
    };
  }

  const { data, error } = await db
    .from("journals")
    .insert({
      org_id,
      date,
      description: description || null,
      entries,
      created_by: created_by || "00000000-0000-0000-0000-000000000000",
    })
    .select()
    .single();

  if (error) {
    return { success: false, message: `仕訳作成エラー: ${error.message}` };
  }

  return {
    success: true,
    message: `仕訳を登録しました: ${formatDateJP(date)} ${description || ""}（${formatYen(totalDebit)}）`,
    data: {
      ...data,
      total_debit: totalDebit,
      total_debit_formatted: formatYen(totalDebit),
      total_credit: totalCredit,
      total_credit_formatted: formatYen(totalCredit),
      date_formatted: formatDateJP(date),
    },
  };
}

async function getPL(
  db: SupabaseClient,
  params: Record<string, any>,
): Promise<DomainResponse> {
  const { org_id, period } = params;
  if (!org_id || !period) {
    return { success: false, message: "org_id と period は必須です" };
  }

  const { start, end } = parsePeriod(period);

  // Get accounts
  const { data: accounts, error: accErr } = await db
    .from("accounts")
    .select("id, code, name, type")
    .eq("org_id", org_id)
    .in("type", ["revenue", "expense"]);

  if (accErr) {
    return { success: false, message: `勘定科目取得エラー: ${accErr.message}` };
  }

  const accountMap = new Map(
    (accounts || []).map((a: any) => [a.id, a]),
  );

  // Get journals for the period
  const { data: journals, error: jrnErr } = await db
    .from("journals")
    .select("entries")
    .eq("org_id", org_id)
    .gte("date", start)
    .lte("date", end);

  if (jrnErr) {
    return { success: false, message: `仕訳取得エラー: ${jrnErr.message}` };
  }

  // Aggregate by account
  const totals: Record<string, number> = {};
  for (const j of journals || []) {
    for (const e of (j.entries as JournalEntry[]) || []) {
      if (!accountMap.has(e.account_id)) continue;
      const acc = accountMap.get(e.account_id)!;
      if (!totals[e.account_id]) totals[e.account_id] = 0;
      if (acc.type === "revenue") {
        totals[e.account_id] += Number(e.credit || 0) - Number(e.debit || 0);
      } else if (acc.type === "expense") {
        totals[e.account_id] += Number(e.debit || 0) - Number(e.credit || 0);
      }
    }
  }

  const revenueItems: any[] = [];
  const expenseItems: any[] = [];
  let totalRevenue = 0;
  let totalExpense = 0;

  for (const [accountId, amount] of Object.entries(totals)) {
    const acc = accountMap.get(accountId);
    if (!acc) continue;
    const item = {
      account_id: accountId,
      code: acc.code,
      name: acc.name,
      amount,
      amount_formatted: formatYen(amount),
    };
    if (acc.type === "revenue") {
      revenueItems.push(item);
      totalRevenue += amount;
    } else {
      expenseItems.push(item);
      totalExpense += amount;
    }
  }

  const netIncome = totalRevenue - totalExpense;

  return {
    success: true,
    message: `${period} 損益計算書 - 売上: ${formatYen(totalRevenue)}、費用: ${formatYen(totalExpense)}、純利益: ${formatYen(netIncome)}`,
    data: {
      period,
      revenue: {
        items: revenueItems,
        total: totalRevenue,
        total_formatted: formatYen(totalRevenue),
      },
      expenses: {
        items: expenseItems,
        total: totalExpense,
        total_formatted: formatYen(totalExpense),
      },
      net_income: netIncome,
      net_income_formatted: formatYen(netIncome),
    },
  };
}

async function getBS(
  db: SupabaseClient,
  params: Record<string, any>,
): Promise<DomainResponse> {
  const { org_id, date } = params;
  if (!org_id || !date) {
    return { success: false, message: "org_id と date は必須です" };
  }

  // Get accounts
  const { data: accounts, error: accErr } = await db
    .from("accounts")
    .select("id, code, name, type")
    .eq("org_id", org_id)
    .in("type", ["asset", "liability", "equity"]);

  if (accErr) {
    return { success: false, message: `勘定科目取得エラー: ${accErr.message}` };
  }

  const accountMap = new Map(
    (accounts || []).map((a: any) => [a.id, a]),
  );

  // Get all journals up to the date
  const { data: journals, error: jrnErr } = await db
    .from("journals")
    .select("entries")
    .eq("org_id", org_id)
    .lte("date", date);

  if (jrnErr) {
    return { success: false, message: `仕訳取得エラー: ${jrnErr.message}` };
  }

  // Aggregate balances
  const balances: Record<string, number> = {};
  for (const j of journals || []) {
    for (const e of (j.entries as JournalEntry[]) || []) {
      if (!accountMap.has(e.account_id)) continue;
      if (!balances[e.account_id]) balances[e.account_id] = 0;
      const acc = accountMap.get(e.account_id)!;
      if (acc.type === "asset") {
        balances[e.account_id] += Number(e.debit || 0) - Number(e.credit || 0);
      } else {
        // liability and equity: credit increases
        balances[e.account_id] += Number(e.credit || 0) - Number(e.debit || 0);
      }
    }
  }

  const assetItems: any[] = [];
  const liabilityItems: any[] = [];
  const equityItems: any[] = [];
  let totalAssets = 0;
  let totalLiabilities = 0;
  let totalEquity = 0;

  for (const [accountId, balance] of Object.entries(balances)) {
    const acc = accountMap.get(accountId);
    if (!acc) continue;
    const item = {
      account_id: accountId,
      code: acc.code,
      name: acc.name,
      balance,
      balance_formatted: formatYen(balance),
    };
    switch (acc.type) {
      case "asset":
        assetItems.push(item);
        totalAssets += balance;
        break;
      case "liability":
        liabilityItems.push(item);
        totalLiabilities += balance;
        break;
      case "equity":
        equityItems.push(item);
        totalEquity += balance;
        break;
    }
  }

  return {
    success: true,
    message: `${formatDateJP(date)} 時点の貸借対照表 - 資産: ${formatYen(totalAssets)}、負債: ${formatYen(totalLiabilities)}、純資産: ${formatYen(totalEquity)}`,
    data: {
      date,
      date_formatted: formatDateJP(date),
      assets: {
        items: assetItems,
        total: totalAssets,
        total_formatted: formatYen(totalAssets),
      },
      liabilities: {
        items: liabilityItems,
        total: totalLiabilities,
        total_formatted: formatYen(totalLiabilities),
      },
      equity: {
        items: equityItems,
        total: totalEquity,
        total_formatted: formatYen(totalEquity),
      },
      balanced: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01,
    },
  };
}

async function approveExpense(
  db: SupabaseClient,
  params: Record<string, any>,
): Promise<DomainResponse> {
  const { org_id, expense_id, approver_id } = params;
  if (!org_id || !expense_id || !approver_id) {
    return {
      success: false,
      message: "org_id, expense_id, approver_id は必須です",
    };
  }

  // Fetch the expense
  const { data: expense, error: fetchErr } = await db
    .from("expenses")
    .select("*")
    .eq("id", expense_id)
    .eq("org_id", org_id)
    .single();

  if (fetchErr || !expense) {
    return { success: false, message: "経費が見つかりません" };
  }

  if (expense.status !== "pending") {
    return {
      success: false,
      message: `この経費は既に${expense.status === "approved" ? "承認" : "却下"}されています`,
    };
  }

  // Update expense status
  const { data: updated, error: updateErr } = await db
    .from("expenses")
    .update({
      status: "approved",
      approved_by: approver_id,
    })
    .eq("id", expense_id)
    .eq("org_id", org_id)
    .select()
    .single();

  if (updateErr) {
    return { success: false, message: `承認エラー: ${updateErr.message}` };
  }

  // Also update the approval request if exists
  await db
    .from("approval_requests")
    .update({
      status: "approved",
      approver_id,
      approved_at: new Date().toISOString(),
    })
    .eq("org_id", org_id)
    .eq("domain", "accounting")
    .eq("type", "expense_approval")
    .contains("data", { expense_id })
    .eq("status", "pending");

  return {
    success: true,
    message: `経費を承認しました: ${formatYen(Number(updated.amount))}（${updated.category}）`,
    data: {
      ...updated,
      amount_formatted: formatYen(Number(updated.amount)),
    },
  };
}

// =============================================================================
// Router
// =============================================================================

const ACTIONS: Record<
  string,
  (db: SupabaseClient, params: Record<string, any>) => Promise<DomainResponse>
> = {
  get_revenue: getRevenue,
  get_expenses: getExpenses,
  create_expense: createExpense,
  create_invoice: createInvoice,
  create_journal: createJournal,
  get_pl: getPL,
  get_bs: getBS,
  approve_expense: approveExpense,
};

// =============================================================================
// Main handler
// =============================================================================

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json(405, { success: false, message: "Method not allowed" });
  }

  try {
    // Verify authorization
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return json(401, { success: false, message: "Authorization header is required" });
    }

    const body: DomainRequest = await req.json();
    const { action, params } = body;

    if (!action || !params) {
      return json(400, {
        success: false,
        message: "action と params は必須です",
      });
    }

    const handler = ACTIONS[action];
    if (!handler) {
      return json(400, {
        success: false,
        message: `不明なアクション: ${action}。利用可能: ${Object.keys(ACTIONS).join(", ")}`,
      });
    }

    const db = getAdminClient();
    const result = await handler(db, params);

    return json(result.success ? 200 : 400, result);
  } catch (err) {
    console.error("domain-accounting error:", err);
    return json(500, {
      success: false,
      message: `内部エラーが発生しました: ${(err as Error).message}`,
    });
  }
});
