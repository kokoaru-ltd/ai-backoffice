import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

// =============================================================================
// Types
// =============================================================================

type Domain = "accounting" | "hr" | "crm" | "documents" | "general" | "multi";
type Operation = "read" | "write";
type Source = "line" | "slack" | "web";

interface GatewayRequest {
  user_id: string;
  message: string;
  source: Source;
  org_id?: string;
}

interface IntentClassification {
  domain: Domain;
  intent: string;
  operation: Operation;
  parameters: Record<string, unknown>;
  confidence: number;
  sub_requests?: Array<{
    domain: Exclude<Domain, "multi">;
    intent: string;
    operation: Operation;
    parameters: Record<string, unknown>;
  }>;
  response_hint?: string;
}

interface UserContext {
  user_id: string;
  org_id: string;
  role: "owner" | "admin" | "member";
  permissions: Record<string, string>;
  full_name: string | null;
  employee_id: string | null;
}

interface DomainResult {
  success: boolean;
  message: string;
  data?: unknown;
  error?: string;
}

interface GatewayResponse {
  success: boolean;
  message: string;
  data?: unknown;
  domain?: string;
  intent?: string;
}

// =============================================================================
// CORS & Response helpers
// =============================================================================

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, apikey, content-type, x-client-info, x-source",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// =============================================================================
// Claude API — Intent Classification
// =============================================================================

const INTENT_SYSTEM_PROMPT = `あなたは中小企業向けAIバックオフィスアシスタントの意図分類エンジンです。
ユーザーからの自然言語メッセージを解析し、以下のJSON形式で分類結果を返してください。

## 出力フォーマット（必ずJSONのみを返すこと）
{
  "domain": "accounting" | "hr" | "crm" | "documents" | "general" | "multi",
  "intent": "<具体的な操作意図>",
  "operation": "read" | "write",
  "parameters": { <抽出されたパラメータ> },
  "confidence": 0.0〜1.0,
  "sub_requests": [ ... ],  // domainが"multi"の場合のみ
  "response_hint": "<回答のヒント（任意）>"
}

## ドメイン分類ルール

### accounting（会計・経理）
対象: 売上、経費、請求書、仕訳、損益計算書(PL)、貸借対照表(BS)、勘定科目
意図の例:
- get_revenue: 売上を確認（parameters: { period: "2025-01", ... }）
- get_expenses: 経費一覧（parameters: { period, category?, status? }）
- create_expense: 経費申請（parameters: { category, amount, description }）
- get_invoices: 請求書一覧（parameters: { type?: "receivable"|"payable", status? }）
- create_invoice: 請求書作成（parameters: { contact_id?, amount, type }）
- create_journal: 仕訳作成（parameters: { date, description, entries }）
- get_pl: 損益計算書取得（parameters: { period }）
- get_bs: 貸借対照表取得（parameters: { date }）
- approve_expense: 経費承認（parameters: { expense_id }）

### hr（人事・労務）
対象: 出退勤、給与、有休、残業、従業員情報
意図の例:
- clock_in: 出勤打刻（parameters: {}）
- clock_out: 退勤打刻（parameters: {}）
- get_attendance: 勤怠確認（parameters: { employee_name?, period? }）
- request_leave: 有休申請（parameters: { date, type }）
- get_payroll: 給与明細確認（parameters: { period? }）
- get_overtime: 残業時間確認（parameters: { employee_name?, period? }）
- get_leave_balance: 有休残日数確認（parameters: { employee_name? }）
- get_employees: 従業員一覧（parameters: { department? }）

### crm（顧客管理・営業）
対象: 顧客、取引先、商談、対応履歴、テレアポ
意図の例:
- get_contacts: 顧客一覧（parameters: { search?, tags? }）
- create_contact: 顧客登録（parameters: { company_name, contact_name, ... }）
- get_deals: 商談一覧（parameters: { stage?, assigned_to? }）
- create_deal: 商談作成（parameters: { contact_id, title, amount }）
- update_deal_stage: 商談ステージ更新（parameters: { deal_id, stage }）
- log_interaction: 対応履歴記録（parameters: { contact_id, type, summary }）
- get_teleapo_schedule: テレアポ予定確認（parameters: { date? }）
- schedule_teleapo: テレアポ予約（parameters: { contact_id, scheduled_at }）

### documents（書類・文書管理）
対象: 契約書、見積書、テンプレート、社内文書、規程、RAG検索
意図の例:
- search_documents: 文書検索（parameters: { query }）
- get_document: 文書取得（parameters: { document_id? title? }）
- create_document: 文書作成（parameters: { title, category, content }）
- get_templates: テンプレート一覧（parameters: { category? }）
- generate_from_template: テンプレートから生成（parameters: { template_id, variables }）
- rag_search: セマンティック検索（parameters: { query }）

### general（総務）
対象: 備品管理、消耗品、オフィスリクエスト、来客、修理依頼
意図の例:
- get_equipment: 備品一覧（parameters: { status?, category? }）
- register_equipment: 備品登録（parameters: { name, category, location }）
- create_request: 総務依頼（parameters: { type, description }）
- get_requests: 依頼一覧（parameters: { status?, type? }）
- update_request_status: 依頼ステータス更新（parameters: { request_id, status }）

### multi（複数ドメインにまたがる質問）
「売上と山田の残業教えて」のように複数ドメインにまたがる場合:
- domain: "multi"
- sub_requests に各ドメインのリクエストを配列で含める

## パラメータ抽出ルール
- 日付・期間: "今月", "先月", "2025年1月" → ISO形式に変換（例: "2025-01"）
- 人名: "山田さん", "田中" → employee_name に抽出
- 金額: "5万円", "100,000円" → 数値に変換
- 曖昧な場合は parameters に null を設定し、confidence を下げる

## 分類のヒント
- 「いくら」「売上」「経費」→ accounting
- 「出勤」「退勤」「休み」「残業」「給与」→ hr
- 「お客さん」「商談」「テレアポ」「取引先」→ crm
- 「契約書」「見積書」「テンプレ」「規程」「マニュアル」→ documents
- 「備品」「消耗品」「修理」「来客」→ general
- 上記に当てはまらない雑談や挨拶 → general / intent: "chitchat" / operation: "read"

## 重要
- 必ず有効なJSONのみを返すこと（説明文や前置きは不要）
- confidenceが0.5未満の場合でも最善の推測を返すこと
- ユーザーの意図が不明確な場合はresponse_hintに確認すべき内容を記載すること`;

async function classifyIntent(
  message: string,
  userContext: UserContext,
): Promise<IntentClassification> {
  const anthropicApiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!anthropicApiKey) {
    throw new Error("ANTHROPIC_API_KEY is not configured");
  }

  const today = new Date().toISOString().split("T")[0];

  const userPrompt = `## ユーザー情報
- 名前: ${userContext.full_name ?? "不明"}
- ロール: ${userContext.role}
- 今日の日付: ${today}

## ユーザーメッセージ
${message}`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": anthropicApiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: INTENT_SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`Claude API error (${response.status}): ${errBody}`);
  }

  const result = await response.json();
  const text: string = result.content?.[0]?.text ?? "";

  // Extract JSON from Claude's response (handle potential markdown wrapping)
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error(`Failed to parse intent classification: ${text}`);
  }

  const parsed = JSON.parse(jsonMatch[0]) as IntentClassification;

  // Validate required fields
  if (!parsed.domain || !parsed.intent || !parsed.operation) {
    throw new Error(
      `Incomplete intent classification: ${JSON.stringify(parsed)}`,
    );
  }

  return parsed;
}

// =============================================================================
// User Context Resolution
// =============================================================================

async function resolveUserContext(
  admin: SupabaseClient,
  userId: string,
  orgId?: string,
): Promise<UserContext> {
  // If org_id not provided, find the user's first org
  let resolvedOrgId = orgId;

  if (!resolvedOrgId) {
    const { data: membership, error: memErr } = await admin
      .from("org_members")
      .select("org_id")
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle();

    if (memErr || !membership) {
      throw new Error("USER_NO_ORG");
    }
    resolvedOrgId = membership.org_id;
  }

  // Get org membership with permissions
  const { data: member, error: memberErr } = await admin
    .from("org_members")
    .select("role, permissions")
    .eq("org_id", resolvedOrgId)
    .eq("user_id", userId)
    .maybeSingle();

  if (memberErr || !member) {
    throw new Error("USER_NOT_MEMBER");
  }

  // Get user profile
  const { data: profile } = await admin
    .from("user_profiles")
    .select("full_name")
    .eq("id", userId)
    .maybeSingle();

  // Get employee_id if exists
  const { data: employee } = await admin
    .from("employees")
    .select("id")
    .eq("org_id", resolvedOrgId)
    .eq("user_id", userId)
    .maybeSingle();

  return {
    user_id: userId,
    org_id: resolvedOrgId,
    role: member.role,
    permissions: (member.permissions as Record<string, string>) ?? {},
    full_name: profile?.full_name ?? null,
    employee_id: employee?.id ?? null,
  };
}

// =============================================================================
// Permission Checks
// =============================================================================

function checkPermission(
  userContext: UserContext,
  domain: string,
  operation: Operation,
): { allowed: boolean; reason?: string } {
  // owner and admin always have full access
  if (userContext.role === "owner" || userContext.role === "admin") {
    return { allowed: true };
  }

  // Map domain names to permission keys
  const domainPermissionKey: Record<string, string> = {
    accounting: "accounting",
    hr: "hr",
    crm: "crm",
    documents: "documents",
    general: "general_affairs",
  };

  const permKey = domainPermissionKey[domain];
  if (!permKey) {
    return { allowed: false, reason: `不明なドメイン: ${domain}` };
  }

  const perm = userContext.permissions[permKey];

  if (operation === "read") {
    if (perm === "r" || perm === "rw") {
      return { allowed: true };
    }
    return {
      allowed: false,
      reason: `${domain}ドメインの閲覧権限がありません。管理者に権限の付与を依頼してください。`,
    };
  }

  if (operation === "write") {
    if (perm === "rw") {
      return { allowed: true };
    }
    if (perm === "r") {
      return {
        allowed: false,
        reason: `${domain}ドメインの閲覧権限はありますが、書き込み権限がありません。管理者に権限の変更を依頼してください。`,
      };
    }
    return {
      allowed: false,
      reason: `${domain}ドメインの権限がありません。管理者に権限の付与を依頼してください。`,
    };
  }

  return { allowed: false, reason: "不正なオペレーション" };
}

// =============================================================================
// Domain Handlers
// =============================================================================

// Each domain handler calls the corresponding Edge Function or performs
// direct DB operations via the admin client.
// For now, we implement direct DB operations for core use cases and
// provide an extensible structure for future domain function calls.

const SUPABASE_URL = () => Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = () =>
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

async function callDomainFunction(
  functionName: string,
  payload: Record<string, unknown>,
): Promise<DomainResult> {
  const url = `${SUPABASE_URL()}/functions/v1/${functionName}`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY()}`,
    },
    body: JSON.stringify(payload),
  });

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    return {
      success: false,
      message: body?.message ?? body?.error ?? `Domain function error: ${response.status}`,
      error: body?.error ?? "domain_function_error",
    };
  }

  return {
    success: true,
    message: body?.message ?? "完了しました",
    data: body?.data ?? body,
  };
}

// --- Accounting Handler ---

async function handleAccounting(
  admin: SupabaseClient,
  intent: string,
  parameters: Record<string, unknown>,
  userContext: UserContext,
): Promise<DomainResult> {
  const orgId = userContext.org_id;

  switch (intent) {
    case "get_revenue": {
      const period = parameters.period as string | undefined;
      let query = admin
        .from("invoices")
        .select("id, amount, tax_amount, status, due_date, created_at")
        .eq("org_id", orgId)
        .eq("type", "receivable");

      if (period) {
        query = query
          .gte("created_at", `${period}-01`)
          .lt("created_at", `${period}-31T23:59:59`);
      }

      const { data, error } = await query;
      if (error) return { success: false, message: error.message, error: "db_error" };

      const total = (data ?? []).reduce(
        (sum, inv) => sum + Number(inv.amount),
        0,
      );
      const paidTotal = (data ?? [])
        .filter((inv) => inv.status === "paid")
        .reduce((sum, inv) => sum + Number(inv.amount), 0);

      return {
        success: true,
        message: `売上合計: ¥${total.toLocaleString()}（入金済: ¥${paidTotal.toLocaleString()}）、${(data ?? []).length}件の請求書`,
        data: { total, paid_total: paidTotal, count: (data ?? []).length, invoices: data },
      };
    }

    case "get_expenses": {
      const period = parameters.period as string | undefined;
      const category = parameters.category as string | undefined;
      const status = parameters.status as string | undefined;

      let query = admin
        .from("expenses")
        .select("id, category, amount, description, status, created_at")
        .eq("org_id", orgId);

      if (period) {
        query = query
          .gte("created_at", `${period}-01`)
          .lt("created_at", `${period}-31T23:59:59`);
      }
      if (category) query = query.eq("category", category);
      if (status) query = query.eq("status", status);

      const { data, error } = await query;
      if (error) return { success: false, message: error.message, error: "db_error" };

      const total = (data ?? []).reduce(
        (sum, exp) => sum + Number(exp.amount),
        0,
      );

      return {
        success: true,
        message: `経費合計: ¥${total.toLocaleString()}、${(data ?? []).length}件`,
        data: { total, count: (data ?? []).length, expenses: data },
      };
    }

    case "create_expense": {
      const { data, error } = await admin.from("expenses").insert({
        org_id: orgId,
        user_id: userContext.user_id,
        category: parameters.category as string,
        amount: Number(parameters.amount),
        tax_amount: Number(parameters.tax_amount ?? 0),
        description: parameters.description as string ?? "",
        status: "pending",
      }).select().single();

      if (error) return { success: false, message: error.message, error: "db_error" };

      return {
        success: true,
        message: `経費申請を作成しました（¥${Number(parameters.amount).toLocaleString()}、カテゴリ: ${parameters.category}）`,
        data,
      };
    }

    case "get_invoices": {
      const invType = parameters.type as string | undefined;
      const status = parameters.status as string | undefined;

      let query = admin
        .from("invoices")
        .select("id, type, amount, tax_amount, status, due_date, created_at")
        .eq("org_id", orgId);

      if (invType) query = query.eq("type", invType);
      if (status) query = query.eq("status", status);

      const { data, error } = await query.order("created_at", { ascending: false }).limit(50);
      if (error) return { success: false, message: error.message, error: "db_error" };

      return {
        success: true,
        message: `請求書: ${(data ?? []).length}件`,
        data: { count: (data ?? []).length, invoices: data },
      };
    }

    case "create_invoice": {
      return callDomainFunction("domain-accounting", {
        action: "create_invoice",
        org_id: orgId,
        user_id: userContext.user_id,
        ...parameters,
      });
    }

    case "create_journal": {
      return callDomainFunction("domain-accounting", {
        action: "create_journal",
        org_id: orgId,
        user_id: userContext.user_id,
        ...parameters,
      });
    }

    case "get_pl":
    case "get_bs": {
      return callDomainFunction("domain-accounting", {
        action: intent,
        org_id: orgId,
        ...parameters,
      });
    }

    case "approve_expense": {
      const expenseId = parameters.expense_id as string;
      if (!expenseId) {
        return { success: false, message: "経費IDが指定されていません", error: "missing_param" };
      }

      const { data, error } = await admin
        .from("expenses")
        .update({ status: "approved", approved_by: userContext.user_id })
        .eq("id", expenseId)
        .eq("org_id", orgId)
        .select()
        .single();

      if (error) return { success: false, message: error.message, error: "db_error" };

      return {
        success: true,
        message: `経費（¥${Number(data.amount).toLocaleString()}）を承認しました`,
        data,
      };
    }

    default:
      return callDomainFunction("domain-accounting", {
        action: intent,
        org_id: orgId,
        user_id: userContext.user_id,
        ...parameters,
      });
  }
}

// --- HR Handler ---

async function handleHr(
  admin: SupabaseClient,
  intent: string,
  parameters: Record<string, unknown>,
  userContext: UserContext,
): Promise<DomainResult> {
  const orgId = userContext.org_id;

  switch (intent) {
    case "clock_in": {
      if (!userContext.employee_id) {
        return { success: false, message: "従業員レコードが見つかりません", error: "no_employee" };
      }

      const today = new Date().toISOString().split("T")[0];
      const now = new Date().toISOString();

      // Check if already clocked in today
      const { data: existing } = await admin
        .from("attendance")
        .select("id, clock_in")
        .eq("employee_id", userContext.employee_id)
        .eq("date", today)
        .maybeSingle();

      if (existing?.clock_in) {
        return {
          success: false,
          message: `本日は既に出勤打刻済みです（${new Date(existing.clock_in).toLocaleTimeString("ja-JP")}）`,
          error: "already_clocked_in",
        };
      }

      if (existing) {
        // Update existing record
        const { error } = await admin
          .from("attendance")
          .update({ clock_in: now })
          .eq("id", existing.id);

        if (error) return { success: false, message: error.message, error: "db_error" };
      } else {
        // Create new attendance record
        const { error } = await admin.from("attendance").insert({
          org_id: orgId,
          employee_id: userContext.employee_id,
          date: today,
          clock_in: now,
          type: "normal",
        });

        if (error) return { success: false, message: error.message, error: "db_error" };
      }

      return {
        success: true,
        message: `出勤打刻しました（${new Date(now).toLocaleTimeString("ja-JP")}）`,
        data: { clock_in: now, date: today },
      };
    }

    case "clock_out": {
      if (!userContext.employee_id) {
        return { success: false, message: "従業員レコードが見つかりません", error: "no_employee" };
      }

      const today = new Date().toISOString().split("T")[0];
      const now = new Date().toISOString();

      const { data: existing } = await admin
        .from("attendance")
        .select("id, clock_in, clock_out")
        .eq("employee_id", userContext.employee_id)
        .eq("date", today)
        .maybeSingle();

      if (!existing || !existing.clock_in) {
        return { success: false, message: "本日の出勤打刻がありません。先に出勤打刻してください。", error: "no_clock_in" };
      }

      if (existing.clock_out) {
        return {
          success: false,
          message: `本日は既に退勤打刻済みです（${new Date(existing.clock_out).toLocaleTimeString("ja-JP")}）`,
          error: "already_clocked_out",
        };
      }

      // Calculate overtime (over 8 hours minus break)
      const clockIn = new Date(existing.clock_in);
      const clockOut = new Date(now);
      const workedMinutes = Math.floor((clockOut.getTime() - clockIn.getTime()) / 60000);
      const breakMinutes = workedMinutes > 360 ? 60 : 0; // 6h+ = 60min break
      const netWorkedMinutes = workedMinutes - breakMinutes;
      const overtimeMinutes = Math.max(0, netWorkedMinutes - 480); // 480min = 8h

      const { error } = await admin
        .from("attendance")
        .update({
          clock_out: now,
          break_minutes: breakMinutes,
          overtime_minutes: overtimeMinutes,
        })
        .eq("id", existing.id);

      if (error) return { success: false, message: error.message, error: "db_error" };

      const hours = Math.floor(netWorkedMinutes / 60);
      const mins = netWorkedMinutes % 60;
      let msg = `退勤打刻しました（${new Date(now).toLocaleTimeString("ja-JP")}）。勤務時間: ${hours}時間${mins}分`;
      if (overtimeMinutes > 0) {
        msg += `（うち残業: ${Math.floor(overtimeMinutes / 60)}時間${overtimeMinutes % 60}分）`;
      }

      return {
        success: true,
        message: msg,
        data: {
          clock_in: existing.clock_in,
          clock_out: now,
          worked_minutes: netWorkedMinutes,
          overtime_minutes: overtimeMinutes,
        },
      };
    }

    case "get_attendance": {
      const employeeName = parameters.employee_name as string | undefined;
      const period = parameters.period as string | undefined;

      let employeeIds: string[] = [];

      if (employeeName) {
        // Look up employee by name via user_profiles join
        const { data: employees } = await admin
          .from("employees")
          .select("id, user_id")
          .eq("org_id", orgId);

        if (employees && employees.length > 0) {
          const userIds = employees.map((e) => e.user_id);
          const { data: profiles } = await admin
            .from("user_profiles")
            .select("id, full_name")
            .in("id", userIds);

          const matched = (profiles ?? []).filter((p) =>
            p.full_name?.includes(employeeName)
          );
          employeeIds = employees
            .filter((e) => matched.some((m) => m.id === e.user_id))
            .map((e) => e.id);
        }

        if (employeeIds.length === 0) {
          return { success: false, message: `「${employeeName}」に該当する従業員が見つかりません`, error: "not_found" };
        }
      } else if (userContext.employee_id) {
        employeeIds = [userContext.employee_id];
      }

      let query = admin
        .from("attendance")
        .select("id, employee_id, date, clock_in, clock_out, break_minutes, overtime_minutes, type")
        .eq("org_id", orgId);

      if (employeeIds.length > 0) {
        query = query.in("employee_id", employeeIds);
      }

      if (period) {
        const yearMonth = period.substring(0, 7); // "YYYY-MM"
        query = query
          .gte("date", `${yearMonth}-01`)
          .lte("date", `${yearMonth}-31`);
      }

      const { data, error } = await query.order("date", { ascending: false }).limit(31);
      if (error) return { success: false, message: error.message, error: "db_error" };

      const totalOvertime = (data ?? []).reduce(
        (sum, a) => sum + (a.overtime_minutes ?? 0),
        0,
      );

      return {
        success: true,
        message: `勤怠レコード: ${(data ?? []).length}件、残業合計: ${Math.floor(totalOvertime / 60)}時間${totalOvertime % 60}分`,
        data: { count: (data ?? []).length, total_overtime_minutes: totalOvertime, attendance: data },
      };
    }

    case "get_overtime": {
      // Delegate to get_attendance with overtime focus
      const result = await handleHr(admin, "get_attendance", parameters, userContext);
      if (!result.success) return result;

      const records = (result.data as Record<string, unknown>)?.attendance as Array<Record<string, unknown>> ?? [];
      const totalOvertime = records.reduce(
        (sum, a) => sum + (Number(a.overtime_minutes) ?? 0),
        0,
      );

      return {
        success: true,
        message: `残業合計: ${Math.floor(totalOvertime / 60)}時間${totalOvertime % 60}分（${records.length}日分）`,
        data: { total_overtime_minutes: totalOvertime, days: records.length },
      };
    }

    case "get_leave_balance": {
      if (!userContext.employee_id && !parameters.employee_name) {
        return { success: false, message: "従業員を特定できません", error: "no_employee" };
      }

      let empId = userContext.employee_id;

      if (parameters.employee_name) {
        const { data: employees } = await admin
          .from("employees")
          .select("id, user_id")
          .eq("org_id", orgId);

        if (employees) {
          const userIds = employees.map((e) => e.user_id);
          const { data: profiles } = await admin
            .from("user_profiles")
            .select("id, full_name")
            .in("id", userIds);

          const matched = (profiles ?? []).filter((p) =>
            p.full_name?.includes(parameters.employee_name as string)
          );
          const emp = employees.find((e) =>
            matched.some((m) => m.id === e.user_id)
          );
          if (emp) empId = emp.id;
        }
      }

      if (!empId) {
        return { success: false, message: "従業員が見つかりません", error: "not_found" };
      }

      const { data: employee, error } = await admin
        .from("employees")
        .select("paid_leave_total, paid_leave_used")
        .eq("id", empId)
        .single();

      if (error) return { success: false, message: error.message, error: "db_error" };

      const remaining = employee.paid_leave_total - employee.paid_leave_used;

      return {
        success: true,
        message: `有休残日数: ${remaining}日（付与: ${employee.paid_leave_total}日、使用済: ${employee.paid_leave_used}日）`,
        data: {
          total: employee.paid_leave_total,
          used: employee.paid_leave_used,
          remaining,
        },
      };
    }

    case "request_leave":
    case "get_payroll":
    case "get_employees":
    default:
      return callDomainFunction("domain-hr", {
        action: intent,
        org_id: orgId,
        user_id: userContext.user_id,
        employee_id: userContext.employee_id,
        ...parameters,
      });
  }
}

// --- CRM Handler ---

async function handleCrm(
  admin: SupabaseClient,
  intent: string,
  parameters: Record<string, unknown>,
  userContext: UserContext,
): Promise<DomainResult> {
  const orgId = userContext.org_id;

  switch (intent) {
    case "get_contacts": {
      const search = parameters.search as string | undefined;
      const tags = parameters.tags as string[] | undefined;

      let query = admin
        .from("contacts")
        .select("id, company_name, contact_name, email, phone, tags, created_at")
        .eq("org_id", orgId);

      if (search) {
        query = query.or(
          `company_name.ilike.%${search}%,contact_name.ilike.%${search}%,email.ilike.%${search}%`,
        );
      }
      if (tags && tags.length > 0) {
        query = query.overlaps("tags", tags);
      }

      const { data, error } = await query.order("created_at", { ascending: false }).limit(50);
      if (error) return { success: false, message: error.message, error: "db_error" };

      return {
        success: true,
        message: `顧客: ${(data ?? []).length}件${search ? `（「${search}」で検索）` : ""}`,
        data: { count: (data ?? []).length, contacts: data },
      };
    }

    case "create_contact": {
      const { data, error } = await admin.from("contacts").insert({
        org_id: orgId,
        company_name: parameters.company_name as string ?? null,
        contact_name: parameters.contact_name as string,
        email: parameters.email as string ?? null,
        phone: parameters.phone as string ?? null,
        address: parameters.address as string ?? null,
        tags: (parameters.tags as string[]) ?? [],
        notes: parameters.notes as string ?? null,
      }).select().single();

      if (error) return { success: false, message: error.message, error: "db_error" };

      return {
        success: true,
        message: `顧客「${parameters.contact_name}」を登録しました`,
        data,
      };
    }

    case "get_deals": {
      const stage = parameters.stage as string | undefined;
      const assignedTo = parameters.assigned_to as string | undefined;

      let query = admin
        .from("deals")
        .select("id, title, amount, stage, expected_close_date, created_at")
        .eq("org_id", orgId);

      if (stage) query = query.eq("stage", stage);
      if (assignedTo) query = query.eq("assigned_to", assignedTo);

      const { data, error } = await query.order("created_at", { ascending: false }).limit(50);
      if (error) return { success: false, message: error.message, error: "db_error" };

      const totalAmount = (data ?? []).reduce(
        (sum, d) => sum + Number(d.amount),
        0,
      );

      return {
        success: true,
        message: `商談: ${(data ?? []).length}件、合計金額: ¥${totalAmount.toLocaleString()}`,
        data: { count: (data ?? []).length, total_amount: totalAmount, deals: data },
      };
    }

    case "create_deal": {
      const { data, error } = await admin.from("deals").insert({
        org_id: orgId,
        contact_id: parameters.contact_id as string ?? null,
        title: parameters.title as string,
        amount: Number(parameters.amount ?? 0),
        stage: "lead",
        assigned_to: userContext.user_id,
      }).select().single();

      if (error) return { success: false, message: error.message, error: "db_error" };

      return {
        success: true,
        message: `商談「${parameters.title}」を作成しました（¥${Number(parameters.amount ?? 0).toLocaleString()}）`,
        data,
      };
    }

    case "update_deal_stage": {
      const dealId = parameters.deal_id as string;
      const newStage = parameters.stage as string;

      if (!dealId || !newStage) {
        return { success: false, message: "deal_idとstageが必要です", error: "missing_param" };
      }

      const { data, error } = await admin
        .from("deals")
        .update({ stage: newStage })
        .eq("id", dealId)
        .eq("org_id", orgId)
        .select()
        .single();

      if (error) return { success: false, message: error.message, error: "db_error" };

      return {
        success: true,
        message: `商談「${data.title}」のステージを「${newStage}」に更新しました`,
        data,
      };
    }

    case "log_interaction": {
      const { data, error } = await admin.from("interactions").insert({
        org_id: orgId,
        contact_id: parameters.contact_id as string,
        deal_id: parameters.deal_id as string ?? null,
        type: parameters.type as string ?? "note",
        summary: parameters.summary as string ?? "",
        details: parameters.details as string ?? null,
        created_by: userContext.user_id,
      }).select().single();

      if (error) return { success: false, message: error.message, error: "db_error" };

      return {
        success: true,
        message: `対応履歴を記録しました（種別: ${parameters.type}）`,
        data,
      };
    }

    case "get_teleapo_schedule":
    case "schedule_teleapo":
    default:
      return callDomainFunction("domain-crm", {
        action: intent,
        org_id: orgId,
        user_id: userContext.user_id,
        ...parameters,
      });
  }
}

// --- Documents Handler ---

async function handleDocuments(
  admin: SupabaseClient,
  intent: string,
  parameters: Record<string, unknown>,
  userContext: UserContext,
): Promise<DomainResult> {
  const orgId = userContext.org_id;

  switch (intent) {
    case "search_documents":
    case "rag_search": {
      const queryText = parameters.query as string;
      if (!queryText) {
        return { success: false, message: "検索キーワードを指定してください", error: "missing_param" };
      }

      // First try text-based search; RAG/vector search delegated to domain function
      if (intent === "rag_search") {
        return callDomainFunction("domain-documents", {
          action: "rag_search",
          org_id: orgId,
          query: queryText,
        });
      }

      const { data, error } = await admin
        .from("documents")
        .select("id, title, category, created_at")
        .eq("org_id", orgId)
        .or(`title.ilike.%${queryText}%,content.ilike.%${queryText}%`)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) return { success: false, message: error.message, error: "db_error" };

      return {
        success: true,
        message: `「${queryText}」の検索結果: ${(data ?? []).length}件`,
        data: { count: (data ?? []).length, documents: data },
      };
    }

    case "get_document": {
      const docId = parameters.document_id as string | undefined;
      const title = parameters.title as string | undefined;

      let query = admin
        .from("documents")
        .select("id, title, category, content, file_url, version, created_at")
        .eq("org_id", orgId);

      if (docId) {
        query = query.eq("id", docId);
      } else if (title) {
        query = query.ilike("title", `%${title}%`);
      } else {
        return { success: false, message: "document_idまたはtitleを指定してください", error: "missing_param" };
      }

      const { data, error } = await query.limit(1).maybeSingle();
      if (error) return { success: false, message: error.message, error: "db_error" };

      if (!data) {
        return { success: false, message: "文書が見つかりません", error: "not_found" };
      }

      return {
        success: true,
        message: `文書「${data.title}」（カテゴリ: ${data.category}、バージョン: ${data.version}）`,
        data,
      };
    }

    case "get_templates": {
      const category = parameters.category as string | undefined;

      let query = admin
        .from("templates")
        .select("id, name, category, variables, created_at")
        .eq("org_id", orgId);

      if (category) query = query.eq("category", category);

      const { data, error } = await query.order("created_at", { ascending: false });
      if (error) return { success: false, message: error.message, error: "db_error" };

      return {
        success: true,
        message: `テンプレート: ${(data ?? []).length}件`,
        data: { count: (data ?? []).length, templates: data },
      };
    }

    case "create_document":
    case "generate_from_template":
    default:
      return callDomainFunction("domain-documents", {
        action: intent,
        org_id: orgId,
        user_id: userContext.user_id,
        ...parameters,
      });
  }
}

// --- General Affairs Handler ---

async function handleGeneral(
  admin: SupabaseClient,
  intent: string,
  parameters: Record<string, unknown>,
  userContext: UserContext,
): Promise<DomainResult> {
  const orgId = userContext.org_id;

  switch (intent) {
    case "get_equipment": {
      const status = parameters.status as string | undefined;
      const category = parameters.category as string | undefined;

      let query = admin
        .from("equipment")
        .select("id, name, category, location, status, created_at")
        .eq("org_id", orgId);

      if (status) query = query.eq("status", status);
      if (category) query = query.eq("category", category);

      const { data, error } = await query.order("created_at", { ascending: false }).limit(50);
      if (error) return { success: false, message: error.message, error: "db_error" };

      return {
        success: true,
        message: `備品: ${(data ?? []).length}件`,
        data: { count: (data ?? []).length, equipment: data },
      };
    }

    case "register_equipment": {
      const { data, error } = await admin.from("equipment").insert({
        org_id: orgId,
        name: parameters.name as string,
        category: parameters.category as string ?? null,
        location: parameters.location as string ?? null,
        status: "available",
        registered_by: userContext.user_id,
      }).select().single();

      if (error) return { success: false, message: error.message, error: "db_error" };

      return {
        success: true,
        message: `備品「${parameters.name}」を登録しました`,
        data,
      };
    }

    case "create_request": {
      const { data, error } = await admin.from("office_requests").insert({
        org_id: orgId,
        user_id: userContext.user_id,
        type: parameters.type as string ?? "other",
        description: parameters.description as string,
        status: "pending",
      }).select().single();

      if (error) return { success: false, message: error.message, error: "db_error" };

      return {
        success: true,
        message: `総務リクエストを作成しました（種別: ${parameters.type}）`,
        data,
      };
    }

    case "get_requests": {
      const status = parameters.status as string | undefined;
      const reqType = parameters.type as string | undefined;

      let query = admin
        .from("office_requests")
        .select("id, type, description, status, created_at")
        .eq("org_id", orgId);

      if (status) query = query.eq("status", status);
      if (reqType) query = query.eq("type", reqType);

      const { data, error } = await query.order("created_at", { ascending: false }).limit(50);
      if (error) return { success: false, message: error.message, error: "db_error" };

      return {
        success: true,
        message: `総務リクエスト: ${(data ?? []).length}件`,
        data: { count: (data ?? []).length, requests: data },
      };
    }

    case "chitchat": {
      return {
        success: true,
        message: "何かお手伝いできることはありますか？会計・人事・顧客管理・文書管理・総務に関する質問にお答えします。",
      };
    }

    case "update_request_status":
    default:
      return callDomainFunction("domain-general", {
        action: intent,
        org_id: orgId,
        user_id: userContext.user_id,
        ...parameters,
      });
  }
}

// =============================================================================
// Domain Router
// =============================================================================

async function routeToDomain(
  admin: SupabaseClient,
  domain: Exclude<Domain, "multi">,
  intent: string,
  parameters: Record<string, unknown>,
  userContext: UserContext,
): Promise<DomainResult> {
  switch (domain) {
    case "accounting":
      return handleAccounting(admin, intent, parameters, userContext);
    case "hr":
      return handleHr(admin, intent, parameters, userContext);
    case "crm":
      return handleCrm(admin, intent, parameters, userContext);
    case "documents":
      return handleDocuments(admin, intent, parameters, userContext);
    case "general":
      return handleGeneral(admin, intent, parameters, userContext);
    default:
      return { success: false, message: `未対応のドメイン: ${domain}`, error: "unknown_domain" };
  }
}

// =============================================================================
// Audit Logging
// =============================================================================

async function logToAudit(
  admin: SupabaseClient,
  orgId: string,
  userId: string,
  domain: string,
  intent: string,
  action: string,
  requestBody: unknown,
  responseBody: unknown,
): Promise<void> {
  try {
    await admin.from("ai_logs").insert({
      org_id: orgId,
      user_id: userId,
      domain,
      intent,
      action,
      request_body: requestBody,
      response_body: responseBody,
    });
  } catch (err) {
    // Logging should never break the main flow
    console.error("Failed to write audit log:", err);
  }
}

// =============================================================================
// Main Handler
// =============================================================================

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json(405, { success: false, message: "Method not allowed" });
  }

  const startTime = Date.now();

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return json(500, { success: false, message: "Server configuration error" });
    }

    // Parse request body
    const body: GatewayRequest = await req.json().catch(() => ({} as GatewayRequest));

    if (!body.user_id || !body.message) {
      return json(400, {
        success: false,
        message: "user_id と message は必須です",
      });
    }

    if (!body.source) {
      body.source = "web";
    }

    const validSources: Source[] = ["line", "slack", "web"];
    if (!validSources.includes(body.source)) {
      return json(400, {
        success: false,
        message: `source は ${validSources.join(", ")} のいずれかである必要があります`,
      });
    }

    // Create admin client (service role bypasses RLS)
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // =========================================================================
    // Step 1: Resolve user context and org membership
    // =========================================================================
    let userContext: UserContext;
    try {
      userContext = await resolveUserContext(admin, body.user_id, body.org_id);
    } catch (err) {
      const errMsg = (err as Error).message;
      if (errMsg === "USER_NO_ORG") {
        return json(403, {
          success: false,
          message: "組織に所属していません。管理者に招待を依頼してください。",
        });
      }
      if (errMsg === "USER_NOT_MEMBER") {
        return json(403, {
          success: false,
          message: "指定された組織のメンバーではありません。",
        });
      }
      throw err;
    }

    // =========================================================================
    // Step 2: Classify intent using Claude API
    // =========================================================================
    let classification: IntentClassification;
    try {
      classification = await classifyIntent(body.message, userContext);
    } catch (err) {
      console.error("Intent classification error:", err);

      // Log the failure
      await logToAudit(
        admin,
        userContext.org_id,
        userContext.user_id,
        "unknown",
        "classification_failed",
        "classify",
        { message: body.message, source: body.source },
        { error: (err as Error).message },
      );

      return json(500, {
        success: false,
        message: "メッセージの解析に失敗しました。もう少し具体的にお伝えいただけますか？",
      });
    }

    // =========================================================================
    // Step 3: Handle multi-domain requests
    // =========================================================================
    if (classification.domain === "multi" && classification.sub_requests?.length) {
      const results: Array<{
        domain: string;
        intent: string;
        result: DomainResult;
      }> = [];

      // Check permissions for all sub-requests first
      for (const sub of classification.sub_requests) {
        const permCheck = checkPermission(userContext, sub.domain, sub.operation);
        if (!permCheck.allowed) {
          results.push({
            domain: sub.domain,
            intent: sub.intent,
            result: {
              success: false,
              message: permCheck.reason!,
              error: "permission_denied",
            },
          });
        }
      }

      // Execute permitted sub-requests in parallel
      const permittedSubs = classification.sub_requests.filter(
        (sub) => !results.some((r) => r.domain === sub.domain && r.intent === sub.intent),
      );

      const parallelResults = await Promise.allSettled(
        permittedSubs.map(async (sub) => {
          const result = await routeToDomain(
            admin,
            sub.domain,
            sub.intent,
            sub.parameters,
            userContext,
          );
          return { domain: sub.domain, intent: sub.intent, result };
        }),
      );

      for (const settled of parallelResults) {
        if (settled.status === "fulfilled") {
          results.push(settled.value);
        } else {
          results.push({
            domain: "unknown",
            intent: "unknown",
            result: {
              success: false,
              message: String(settled.reason),
              error: "execution_error",
            },
          });
        }
      }

      // Compose combined message
      const combinedMessage = results
        .map(
          (r) =>
            `【${r.domain}】${r.result.success ? r.result.message : `エラー: ${r.result.message}`}`,
        )
        .join("\n");

      const overallSuccess = results.some((r) => r.result.success);

      // Log the multi-domain request
      await logToAudit(
        admin,
        userContext.org_id,
        userContext.user_id,
        "multi",
        classification.intent,
        "multi_execute",
        { message: body.message, source: body.source, classification },
        { results, success: overallSuccess },
      );

      return json(200, {
        success: overallSuccess,
        message: combinedMessage,
        data: { results },
        domain: "multi",
        intent: classification.intent,
      } satisfies GatewayResponse);
    }

    // =========================================================================
    // Step 4: Single-domain — check permissions
    // =========================================================================
    const permCheck = checkPermission(
      userContext,
      classification.domain,
      classification.operation,
    );

    if (!permCheck.allowed) {
      await logToAudit(
        admin,
        userContext.org_id,
        userContext.user_id,
        classification.domain,
        classification.intent,
        "permission_denied",
        { message: body.message, source: body.source, classification },
        { error: permCheck.reason },
      );

      return json(403, {
        success: false,
        message: permCheck.reason!,
        domain: classification.domain,
        intent: classification.intent,
      } satisfies GatewayResponse);
    }

    // =========================================================================
    // Step 5: Execute the domain handler
    // =========================================================================
    let domainResult: DomainResult;
    try {
      domainResult = await routeToDomain(
        admin,
        classification.domain as Exclude<Domain, "multi">,
        classification.intent,
        classification.parameters,
        userContext,
      );
    } catch (err) {
      console.error("Domain execution error:", err);
      domainResult = {
        success: false,
        message: `処理中にエラーが発生しました: ${(err as Error).message}`,
        error: "execution_error",
      };
    }

    // =========================================================================
    // Step 6: Log to audit table
    // =========================================================================
    await logToAudit(
      admin,
      userContext.org_id,
      userContext.user_id,
      classification.domain,
      classification.intent,
      classification.operation,
      {
        message: body.message,
        source: body.source,
        classification: {
          domain: classification.domain,
          intent: classification.intent,
          operation: classification.operation,
          confidence: classification.confidence,
          parameters: classification.parameters,
        },
      },
      {
        success: domainResult.success,
        message: domainResult.message,
        has_data: !!domainResult.data,
      },
    );

    // =========================================================================
    // Step 7: Return the result
    // =========================================================================
    const elapsed = Date.now() - startTime;

    const response: GatewayResponse & { elapsed_ms?: number } = {
      success: domainResult.success,
      message: domainResult.message,
      data: domainResult.data,
      domain: classification.domain,
      intent: classification.intent,
    };

    // Include elapsed time in non-production environments for debugging
    if (Deno.env.get("ENVIRONMENT") !== "production") {
      response.elapsed_ms = elapsed;
    }

    return json(domainResult.success ? 200 : 400, response);
  } catch (err) {
    console.error("AI Gateway unhandled error:", err);
    return json(500, {
      success: false,
      message: "サーバーエラーが発生しました。しばらく時間をおいて再度お試しください。",
    } satisfies GatewayResponse);
  }
});
