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

function formatDateTimeJP(date: string | Date): string {
  const d = new Date(date);
  return `${d.getFullYear()}\u5e74${d.getMonth() + 1}\u6708${d.getDate()}\u65e5 ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/** Parse "YYYY-MM" period into start/end dates */
function parsePeriod(period: string): { start: string; end: string } {
  const [year, month] = period.split("-").map(Number);
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const endDate = new Date(year, month, 0);
  const end = `${year}-${String(month).padStart(2, "0")}-${String(endDate.getDate()).padStart(2, "0")}`;
  return { start, end };
}

// =============================================================================
// Constants
// =============================================================================

const DEAL_STAGES = ["lead", "proposal", "negotiation", "closed_won", "closed_lost"];

const DEAL_STAGE_LABELS: Record<string, string> = {
  lead: "リード",
  proposal: "提案中",
  negotiation: "商談中",
  closed_won: "受注",
  closed_lost: "失注",
};

const INTERACTION_TYPE_LABELS: Record<string, string> = {
  call: "電話",
  email: "メール",
  meeting: "ミーティング",
  note: "メモ",
};

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

async function getContacts(
  db: SupabaseClient,
  params: Record<string, any>,
): Promise<DomainResponse> {
  const { org_id, search, tags } = params;
  if (!org_id) {
    return { success: false, message: "org_id は必須です" };
  }

  let query = db
    .from("contacts")
    .select("*")
    .eq("org_id", org_id)
    .order("created_at", { ascending: false });

  if (search) {
    query = query.or(
      `company_name.ilike.%${search}%,contact_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`,
    );
  }

  if (tags && Array.isArray(tags) && tags.length > 0) {
    query = query.overlaps("tags", tags);
  }

  const { data, error } = await query;
  if (error) {
    return { success: false, message: `連絡先取得エラー: ${error.message}` };
  }

  const contacts = data || [];

  return {
    success: true,
    message: `連絡先: ${contacts.length}件${search ? `（検索: "${search}"）` : ""}`,
    data: {
      contacts: contacts.map((c: any) => ({
        ...c,
        created_at_formatted: formatDateJP(c.created_at),
      })),
      count: contacts.length,
    },
  };
}

async function createContact(
  db: SupabaseClient,
  params: Record<string, any>,
): Promise<DomainResponse> {
  const { org_id, company_name, contact_name, email, phone } = params;
  if (!org_id || !contact_name) {
    return { success: false, message: "org_id と contact_name は必須です" };
  }

  const { data, error } = await db
    .from("contacts")
    .insert({
      org_id,
      company_name: company_name || null,
      contact_name,
      email: email || null,
      phone: phone || null,
    })
    .select()
    .single();

  if (error) {
    return { success: false, message: `連絡先作成エラー: ${error.message}` };
  }

  return {
    success: true,
    message: `連絡先を登録しました: ${contact_name}${company_name ? ` (${company_name})` : ""}`,
    data: {
      ...data,
      created_at_formatted: formatDateJP(data.created_at),
    },
  };
}

async function getDeals(
  db: SupabaseClient,
  params: Record<string, any>,
): Promise<DomainResponse> {
  const { org_id, stage, assigned_to } = params;
  if (!org_id) {
    return { success: false, message: "org_id は必須です" };
  }

  let query = db
    .from("deals")
    .select("*, contacts(company_name, contact_name)")
    .eq("org_id", org_id)
    .order("created_at", { ascending: false });

  if (stage) {
    query = query.eq("stage", stage);
  }
  if (assigned_to) {
    query = query.eq("assigned_to", assigned_to);
  }

  const { data, error } = await query;
  if (error) {
    return { success: false, message: `案件取得エラー: ${error.message}` };
  }

  const deals = data || [];

  // Pipeline summary
  const pipeline: Record<string, { count: number; total_amount: number }> = {};
  for (const stg of DEAL_STAGES) {
    pipeline[stg] = { count: 0, total_amount: 0 };
  }
  for (const d of deals) {
    if (pipeline[d.stage]) {
      pipeline[d.stage].count++;
      pipeline[d.stage].total_amount += Number(d.amount);
    }
  }

  const totalPipelineAmount = deals
    .filter(
      (d: any) =>
        d.stage !== "closed_won" && d.stage !== "closed_lost",
    )
    .reduce((sum: number, d: any) => sum + Number(d.amount), 0);

  return {
    success: true,
    message: `案件: ${deals.length}件、パイプライン合計: ${formatYen(totalPipelineAmount)}`,
    data: {
      deals: deals.map((d: any) => ({
        ...d,
        amount_formatted: formatYen(Number(d.amount)),
        stage_label: DEAL_STAGE_LABELS[d.stage] || d.stage,
        created_at_formatted: formatDateJP(d.created_at),
        expected_close_date_formatted: d.expected_close_date
          ? formatDateJP(d.expected_close_date)
          : null,
      })),
      pipeline: Object.fromEntries(
        Object.entries(pipeline).map(([stg, data]) => [
          stg,
          {
            ...data,
            label: DEAL_STAGE_LABELS[stg] || stg,
            total_amount_formatted: formatYen(data.total_amount),
          },
        ]),
      ),
      total_pipeline_amount: totalPipelineAmount,
      total_pipeline_amount_formatted: formatYen(totalPipelineAmount),
      count: deals.length,
    },
  };
}

async function createDeal(
  db: SupabaseClient,
  params: Record<string, any>,
): Promise<DomainResponse> {
  const { org_id, contact_id, title, amount, stage } = params;
  if (!org_id || !contact_id || !title || amount == null) {
    return {
      success: false,
      message: "org_id, contact_id, title, amount は必須です",
    };
  }

  const numAmount = Number(amount);
  if (isNaN(numAmount) || numAmount < 0) {
    return { success: false, message: "amount は0以上の数値で指定してください" };
  }

  const dealStage = stage || "lead";
  if (!DEAL_STAGES.includes(dealStage)) {
    return {
      success: false,
      message: `stage は ${DEAL_STAGES.join(", ")} のいずれかで指定してください`,
    };
  }

  const { data, error } = await db
    .from("deals")
    .insert({
      org_id,
      contact_id,
      title,
      amount: numAmount,
      stage: dealStage,
    })
    .select("*, contacts(company_name, contact_name)")
    .single();

  if (error) {
    return { success: false, message: `案件作成エラー: ${error.message}` };
  }

  return {
    success: true,
    message: `案件を作成しました: ${title}（${formatYen(numAmount)}、${DEAL_STAGE_LABELS[dealStage]}）`,
    data: {
      ...data,
      amount_formatted: formatYen(numAmount),
      stage_label: DEAL_STAGE_LABELS[dealStage],
    },
  };
}

async function updateDealStage(
  db: SupabaseClient,
  params: Record<string, any>,
): Promise<DomainResponse> {
  const { org_id, deal_id, new_stage } = params;
  if (!org_id || !deal_id || !new_stage) {
    return {
      success: false,
      message: "org_id, deal_id, new_stage は必須です",
    };
  }

  if (!DEAL_STAGES.includes(new_stage)) {
    return {
      success: false,
      message: `new_stage は ${DEAL_STAGES.join(", ")} のいずれかで指定してください`,
    };
  }

  // Get current deal
  const { data: currentDeal, error: fetchErr } = await db
    .from("deals")
    .select("stage, title, amount")
    .eq("id", deal_id)
    .eq("org_id", org_id)
    .single();

  if (fetchErr || !currentDeal) {
    return { success: false, message: "案件が見つかりません" };
  }

  const oldStage = currentDeal.stage;

  const { data, error } = await db
    .from("deals")
    .update({ stage: new_stage })
    .eq("id", deal_id)
    .eq("org_id", org_id)
    .select("*, contacts(company_name, contact_name)")
    .single();

  if (error) {
    return {
      success: false,
      message: `ステージ更新エラー: ${error.message}`,
    };
  }

  return {
    success: true,
    message: `案件「${currentDeal.title}」を${DEAL_STAGE_LABELS[oldStage]} → ${DEAL_STAGE_LABELS[new_stage]}に変更しました`,
    data: {
      ...data,
      amount_formatted: formatYen(Number(data.amount)),
      old_stage: oldStage,
      old_stage_label: DEAL_STAGE_LABELS[oldStage],
      new_stage_label: DEAL_STAGE_LABELS[new_stage],
    },
  };
}

async function logInteraction(
  db: SupabaseClient,
  params: Record<string, any>,
): Promise<DomainResponse> {
  const { org_id, contact_id, type, summary, details, deal_id, created_by } =
    params;
  if (!org_id || !contact_id || !type || !summary) {
    return {
      success: false,
      message: "org_id, contact_id, type, summary は必須です",
    };
  }

  const validTypes = ["call", "email", "meeting", "note"];
  if (!validTypes.includes(type)) {
    return {
      success: false,
      message: `type は ${validTypes.join(", ")} のいずれかで指定してください`,
    };
  }

  const { data, error } = await db
    .from("interactions")
    .insert({
      org_id,
      contact_id,
      deal_id: deal_id || null,
      type,
      summary,
      details: details || null,
      created_by: created_by || "00000000-0000-0000-0000-000000000000",
    })
    .select("*, contacts(company_name, contact_name)")
    .single();

  if (error) {
    return { success: false, message: `活動記録エラー: ${error.message}` };
  }

  const typeLabel = INTERACTION_TYPE_LABELS[type] || type;

  return {
    success: true,
    message: `${typeLabel}を記録しました: ${summary}`,
    data: {
      ...data,
      type_label: typeLabel,
      created_at_formatted: formatDateTimeJP(data.created_at),
    },
  };
}

async function getSalesReport(
  db: SupabaseClient,
  params: Record<string, any>,
): Promise<DomainResponse> {
  const { org_id, period } = params;
  if (!org_id || !period) {
    return { success: false, message: "org_id と period は必須です" };
  }

  const { start, end } = parsePeriod(period);

  // Get deals for the period
  const { data: deals, error } = await db
    .from("deals")
    .select("*")
    .eq("org_id", org_id)
    .gte("created_at", `${start}T00:00:00`)
    .lte("created_at", `${end}T23:59:59`);

  if (error) {
    return { success: false, message: `営業レポート取得エラー: ${error.message}` };
  }

  const allDeals = deals || [];

  const won = allDeals.filter((d: any) => d.stage === "closed_won");
  const lost = allDeals.filter((d: any) => d.stage === "closed_lost");
  const active = allDeals.filter(
    (d: any) =>
      d.stage !== "closed_won" && d.stage !== "closed_lost",
  );

  const wonAmount = won.reduce(
    (sum: number, d: any) => sum + Number(d.amount),
    0,
  );
  const lostAmount = lost.reduce(
    (sum: number, d: any) => sum + Number(d.amount),
    0,
  );
  const pipelineAmount = active.reduce(
    (sum: number, d: any) => sum + Number(d.amount),
    0,
  );
  const winRate =
    won.length + lost.length > 0
      ? Math.round((won.length / (won.length + lost.length)) * 100)
      : 0;

  // Get interactions for the period
  const { data: interactions } = await db
    .from("interactions")
    .select("type")
    .eq("org_id", org_id)
    .gte("created_at", `${start}T00:00:00`)
    .lte("created_at", `${end}T23:59:59`);

  const interactionCounts: Record<string, number> = {};
  for (const i of interactions || []) {
    interactionCounts[i.type] = (interactionCounts[i.type] || 0) + 1;
  }

  // Get new contacts for the period
  const { count: newContactsCount } = await db
    .from("contacts")
    .select("id", { count: "exact", head: true })
    .eq("org_id", org_id)
    .gte("created_at", `${start}T00:00:00`)
    .lte("created_at", `${end}T23:59:59`);

  return {
    success: true,
    message: `${period} 営業レポート - 受注: ${formatYen(wonAmount)}（${won.length}件）、パイプライン: ${formatYen(pipelineAmount)}、勝率: ${winRate}%`,
    data: {
      period,
      deals: {
        total: allDeals.length,
        won: {
          count: won.length,
          amount: wonAmount,
          amount_formatted: formatYen(wonAmount),
        },
        lost: {
          count: lost.length,
          amount: lostAmount,
          amount_formatted: formatYen(lostAmount),
        },
        active: {
          count: active.length,
          amount: pipelineAmount,
          amount_formatted: formatYen(pipelineAmount),
        },
        win_rate: winRate,
        win_rate_display: `${winRate}%`,
      },
      interactions: Object.fromEntries(
        Object.entries(interactionCounts).map(([type, count]) => [
          type,
          { count, label: INTERACTION_TYPE_LABELS[type] || type },
        ]),
      ),
      total_interactions: (interactions || []).length,
      new_contacts: newContactsCount || 0,
    },
  };
}

async function scheduleTeleapo(
  db: SupabaseClient,
  params: Record<string, any>,
): Promise<DomainResponse> {
  const { org_id, contact_id, scheduled_at } = params;
  if (!org_id || !contact_id || !scheduled_at) {
    return {
      success: false,
      message: "org_id, contact_id, scheduled_at は必須です",
    };
  }

  // Verify contact exists
  const { data: contact, error: contactErr } = await db
    .from("contacts")
    .select("contact_name, company_name, phone")
    .eq("id", contact_id)
    .eq("org_id", org_id)
    .single();

  if (contactErr || !contact) {
    return { success: false, message: "連絡先が見つかりません" };
  }

  if (!contact.phone) {
    return {
      success: false,
      message: `${contact.contact_name} の電話番号が登録されていません`,
    };
  }

  const { data, error } = await db
    .from("teleapo_calls")
    .insert({
      org_id,
      contact_id,
      status: "scheduled",
      scheduled_at,
    })
    .select()
    .single();

  if (error) {
    return {
      success: false,
      message: `テレアポスケジュール作成エラー: ${error.message}`,
    };
  }

  return {
    success: true,
    message: `テレアポを予約しました: ${contact.contact_name}${contact.company_name ? ` (${contact.company_name})` : ""} - ${formatDateTimeJP(scheduled_at)}`,
    data: {
      ...data,
      contact,
      scheduled_at_formatted: formatDateTimeJP(scheduled_at),
    },
  };
}

async function getTeleapoSchedule(
  db: SupabaseClient,
  params: Record<string, any>,
): Promise<DomainResponse> {
  const { org_id, date } = params;
  if (!org_id) {
    return { success: false, message: "org_id は必須です" };
  }

  let query = db
    .from("teleapo_calls")
    .select("*, contacts(company_name, contact_name, phone)")
    .eq("org_id", org_id)
    .order("scheduled_at", { ascending: true });

  if (date) {
    query = query
      .gte("scheduled_at", `${date}T00:00:00`)
      .lte("scheduled_at", `${date}T23:59:59`);
  }

  const { data, error } = await query;
  if (error) {
    return {
      success: false,
      message: `テレアポスケジュール取得エラー: ${error.message}`,
    };
  }

  const calls = data || [];
  const statusCounts: Record<string, number> = {};
  for (const c of calls) {
    statusCounts[c.status] = (statusCounts[c.status] || 0) + 1;
  }

  const STATUS_LABELS: Record<string, string> = {
    scheduled: "予約済み",
    calling: "架電中",
    completed: "完了",
    no_answer: "不在",
    callback: "折り返し待ち",
  };

  return {
    success: true,
    message: `テレアポスケジュール: ${calls.length}件${date ? `（${formatDateJP(date)}）` : ""}`,
    data: {
      calls: calls.map((c: any) => ({
        ...c,
        status_label: STATUS_LABELS[c.status] || c.status,
        scheduled_at_formatted: c.scheduled_at
          ? formatDateTimeJP(c.scheduled_at)
          : null,
        completed_at_formatted: c.completed_at
          ? formatDateTimeJP(c.completed_at)
          : null,
      })),
      summary: Object.fromEntries(
        Object.entries(statusCounts).map(([status, count]) => [
          status,
          { count, label: STATUS_LABELS[status] || status },
        ]),
      ),
      total: calls.length,
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
  get_contacts: getContacts,
  create_contact: createContact,
  get_deals: getDeals,
  create_deal: createDeal,
  update_deal_stage: updateDealStage,
  log_interaction: logInteraction,
  get_sales_report: getSalesReport,
  schedule_teleapo: scheduleTeleapo,
  get_teleapo_schedule: getTeleapoSchedule,
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
      return json(401, {
        success: false,
        message: "Authorization header is required",
      });
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
    console.error("domain-crm error:", err);
    return json(500, {
      success: false,
      message: `内部エラーが発生しました: ${(err as Error).message}`,
    });
  }
});
