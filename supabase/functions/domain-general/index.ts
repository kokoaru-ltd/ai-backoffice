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

function formatDateJP(date: string | Date): string {
  const d = new Date(date);
  return `${d.getFullYear()}\u5e74${d.getMonth() + 1}\u6708${d.getDate()}\u65e5`;
}

function formatDateTimeJP(date: string | Date): string {
  const d = new Date(date);
  return `${d.getFullYear()}\u5e74${d.getMonth() + 1}\u6708${d.getDate()}\u65e5 ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

// =============================================================================
// Constants
// =============================================================================

const EQUIPMENT_STATUS_LABELS: Record<string, string> = {
  in_use: "\u4f7f\u7528\u4e2d",
  available: "\u5229\u7528\u53ef\u80fd",
  maintenance: "\u30e1\u30f3\u30c6\u30ca\u30f3\u30b9\u4e2d",
  disposed: "\u5ec3\u68c4\u6e08\u307f",
};

const REQUEST_TYPE_LABELS: Record<string, string> = {
  supply: "\u6d88\u8017\u54c1",
  repair: "\u4fee\u7406",
  visitor: "\u6765\u5ba2",
  other: "\u305d\u306e\u4ed6",
};

const REQUEST_STATUS_LABELS: Record<string, string> = {
  pending: "\u7533\u8acb\u4e2d",
  approved: "\u627f\u8a8d\u6e08\u307f",
  in_progress: "\u5bfe\u5fdc\u4e2d",
  completed: "\u5b8c\u4e86",
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

async function getEquipment(
  db: SupabaseClient,
  params: Record<string, any>,
): Promise<DomainResponse> {
  const { org_id, category, status } = params;
  if (!org_id) {
    return { success: false, message: "org_id \u306f\u5fc5\u9808\u3067\u3059" };
  }

  let query = db
    .from("equipment")
    .select("*")
    .eq("org_id", org_id)
    .order("created_at", { ascending: false });

  if (category) {
    query = query.eq("category", category);
  }
  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  if (error) {
    return { success: false, message: `備品取得エラー: ${error.message}` };
  }

  const equipment = data || [];

  // Summary by status
  const statusSummary: Record<string, number> = {};
  for (const e of equipment) {
    statusSummary[e.status] = (statusSummary[e.status] || 0) + 1;
  }

  return {
    success: true,
    message: `備品一覧: ${equipment.length}件`,
    data: {
      equipment: equipment.map((e: any) => ({
        ...e,
        status_label: EQUIPMENT_STATUS_LABELS[e.status] || e.status,
        created_at_formatted: formatDateJP(e.created_at),
      })),
      summary: Object.fromEntries(
        Object.entries(statusSummary).map(([st, count]) => [
          st,
          { count, label: EQUIPMENT_STATUS_LABELS[st] || st },
        ]),
      ),
      count: equipment.length,
    },
  };
}

async function registerEquipment(
  db: SupabaseClient,
  params: Record<string, any>,
): Promise<DomainResponse> {
  const { org_id, name, category, location, photo_url, assigned_to, registered_by } =
    params;
  if (!org_id || !name || !category || !location) {
    return {
      success: false,
      message: "org_id, name, category, location は必須です",
    };
  }

  const { data, error } = await db
    .from("equipment")
    .insert({
      org_id,
      name,
      category,
      location,
      status: assigned_to ? "in_use" : "available",
      assigned_to: assigned_to || null,
      photo_url: photo_url || null,
      registered_by: registered_by || "00000000-0000-0000-0000-000000000000",
    })
    .select()
    .single();

  if (error) {
    return { success: false, message: `備品登録エラー: ${error.message}` };
  }

  return {
    success: true,
    message: `備品を登録しました: ${name}（${category}、${location}）`,
    data: {
      ...data,
      status_label: EQUIPMENT_STATUS_LABELS[data.status] || data.status,
      created_at_formatted: formatDateJP(data.created_at),
    },
  };
}

async function createRequest(
  db: SupabaseClient,
  params: Record<string, any>,
): Promise<DomainResponse> {
  const { org_id, user_id, type, description } = params;
  if (!org_id || !user_id || !type || !description) {
    return {
      success: false,
      message: "org_id, user_id, type, description は必須です",
    };
  }

  const validTypes = ["supply", "repair", "visitor", "other"];
  if (!validTypes.includes(type)) {
    return {
      success: false,
      message: `type は ${validTypes.join(", ")} のいずれかで指定してください`,
    };
  }

  const { data, error } = await db
    .from("office_requests")
    .insert({
      org_id,
      user_id,
      type,
      description,
      status: "pending",
    })
    .select()
    .single();

  if (error) {
    return { success: false, message: `申請作成エラー: ${error.message}` };
  }

  const typeLabel = REQUEST_TYPE_LABELS[type] || type;

  return {
    success: true,
    message: `${typeLabel}の申請を作成しました: ${description}`,
    data: {
      ...data,
      type_label: typeLabel,
      status_label: REQUEST_STATUS_LABELS[data.status] || data.status,
      created_at_formatted: formatDateTimeJP(data.created_at),
    },
  };
}

async function getRequests(
  db: SupabaseClient,
  params: Record<string, any>,
): Promise<DomainResponse> {
  const { org_id, status, user_id } = params;
  if (!org_id) {
    return { success: false, message: "org_id は必須です" };
  }

  let query = db
    .from("office_requests")
    .select("*")
    .eq("org_id", org_id)
    .order("created_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }
  if (user_id) {
    query = query.eq("user_id", user_id);
  }

  const { data, error } = await query;
  if (error) {
    return { success: false, message: `申請取得エラー: ${error.message}` };
  }

  const requests = data || [];

  // Summary by status
  const statusSummary: Record<string, number> = {};
  for (const r of requests) {
    statusSummary[r.status] = (statusSummary[r.status] || 0) + 1;
  }

  // Summary by type
  const typeSummary: Record<string, number> = {};
  for (const r of requests) {
    typeSummary[r.type] = (typeSummary[r.type] || 0) + 1;
  }

  return {
    success: true,
    message: `申請一覧: ${requests.length}件`,
    data: {
      requests: requests.map((r: any) => ({
        ...r,
        type_label: REQUEST_TYPE_LABELS[r.type] || r.type,
        status_label: REQUEST_STATUS_LABELS[r.status] || r.status,
        created_at_formatted: formatDateTimeJP(r.created_at),
      })),
      by_status: Object.fromEntries(
        Object.entries(statusSummary).map(([st, count]) => [
          st,
          { count, label: REQUEST_STATUS_LABELS[st] || st },
        ]),
      ),
      by_type: Object.fromEntries(
        Object.entries(typeSummary).map(([tp, count]) => [
          tp,
          { count, label: REQUEST_TYPE_LABELS[tp] || tp },
        ]),
      ),
      count: requests.length,
    },
  };
}

async function updateRequestStatus(
  db: SupabaseClient,
  params: Record<string, any>,
): Promise<DomainResponse> {
  const { org_id, request_id, status } = params;
  if (!org_id || !request_id || !status) {
    return {
      success: false,
      message: "org_id, request_id, status は必須です",
    };
  }

  const validStatuses = ["pending", "approved", "in_progress", "completed"];
  if (!validStatuses.includes(status)) {
    return {
      success: false,
      message: `status は ${validStatuses.join(", ")} のいずれかで指定してください`,
    };
  }

  // Get current request
  const { data: current, error: fetchErr } = await db
    .from("office_requests")
    .select("status, description, type")
    .eq("id", request_id)
    .eq("org_id", org_id)
    .single();

  if (fetchErr || !current) {
    return { success: false, message: "申請が見つかりません" };
  }

  const oldStatus = current.status;

  const { data, error } = await db
    .from("office_requests")
    .update({ status })
    .eq("id", request_id)
    .eq("org_id", org_id)
    .select()
    .single();

  if (error) {
    return {
      success: false,
      message: `ステータス更新エラー: ${error.message}`,
    };
  }

  return {
    success: true,
    message: `申請「${current.description}」を${REQUEST_STATUS_LABELS[oldStatus]} → ${REQUEST_STATUS_LABELS[status]}に変更しました`,
    data: {
      ...data,
      type_label: REQUEST_TYPE_LABELS[data.type] || data.type,
      old_status: oldStatus,
      old_status_label: REQUEST_STATUS_LABELS[oldStatus] || oldStatus,
      new_status_label: REQUEST_STATUS_LABELS[status] || status,
      created_at_formatted: formatDateTimeJP(data.created_at),
    },
  };
}

async function sendNotification(
  db: SupabaseClient,
  params: Record<string, any>,
): Promise<DomainResponse> {
  const { org_id, user_id, title, body } = params;
  if (!org_id || !user_id || !title || !body) {
    return {
      success: false,
      message: "org_id, user_id, title, body は必須です",
    };
  }

  const { data, error } = await db
    .from("notifications")
    .insert({
      org_id,
      user_id,
      title,
      body,
      read: false,
    })
    .select()
    .single();

  if (error) {
    return { success: false, message: `通知送信エラー: ${error.message}` };
  }

  return {
    success: true,
    message: `通知を送信しました: ${title}`,
    data: {
      ...data,
      created_at_formatted: formatDateTimeJP(data.created_at),
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
  get_equipment: getEquipment,
  register_equipment: registerEquipment,
  create_request: createRequest,
  get_requests: getRequests,
  update_request_status: updateRequestStatus,
  send_notification: sendNotification,
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
    console.error("domain-general error:", err);
    return json(500, {
      success: false,
      message: `内部エラーが発生しました: ${(err as Error).message}`,
    });
  }
});
