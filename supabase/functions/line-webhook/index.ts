import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

// =============================================================================
// Types
// =============================================================================

interface LineEvent {
  type: "message" | "follow" | "unfollow" | "postback";
  replyToken?: string;
  source: {
    type: "user" | "group" | "room";
    userId: string;
    groupId?: string;
    roomId?: string;
  };
  message?: {
    type: "text" | "image" | "video" | "audio" | "file" | "location" | "sticker";
    id: string;
    text?: string;
    contentProvider?: {
      type: "line" | "external";
    };
  };
  postback?: {
    data: string;
  };
  timestamp: number;
}

interface LineWebhookBody {
  destination: string;
  events: LineEvent[];
}

interface LineUser {
  line_user_id: string;
  user_id: string;
  org_id: string;
  display_name: string | null;
  registered_at: string;
}

interface GatewayResponse {
  success: boolean;
  message: string;
  data?: unknown;
  domain?: string;
  intent?: string;
}

// =============================================================================
// LINE Messaging API Helper
// =============================================================================

class LineClient {
  private accessToken: string;
  private baseUrl = "https://api.line.me/v2/bot";

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  /** Reply to a message using a reply token (valid for 1 minute after receiving the event). */
  async reply(replyToken: string, messages: LineMessage[]): Promise<void> {
    const res = await fetch(`${this.baseUrl}/message/reply`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.accessToken}`,
      },
      body: JSON.stringify({ replyToken, messages }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      console.error(`LINE reply API error (${res.status}): ${errBody}`);
    }
  }

  /** Send a push message to a specific user. */
  async pushMessage(to: string, messages: LineMessage[]): Promise<void> {
    const res = await fetch(`${this.baseUrl}/message/push`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.accessToken}`,
      },
      body: JSON.stringify({ to, messages }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      console.error(`LINE push API error (${res.status}): ${errBody}`);
    }
  }

  /** Get binary content (image, video, audio, file) by message ID. */
  async getMessageContent(messageId: string): Promise<ArrayBuffer> {
    const res = await fetch(
      `https://api-data.line.me/v2/bot/message/${messageId}/content`,
      {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      },
    );

    if (!res.ok) {
      throw new Error(`LINE content API error (${res.status})`);
    }

    return res.arrayBuffer();
  }

  /** Get a user's LINE profile. */
  async getProfile(userId: string): Promise<{ displayName: string; userId: string; pictureUrl?: string }> {
    const res = await fetch(`${this.baseUrl}/profile/${userId}`, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    });

    if (!res.ok) {
      throw new Error(`LINE profile API error (${res.status})`);
    }

    return res.json();
  }
}

type LineMessage =
  | { type: "text"; text: string }
  | {
      type: "template";
      altText: string;
      template: {
        type: "buttons";
        text: string;
        actions: Array<{ type: string; label: string; data?: string; text?: string }>;
      };
    };

// =============================================================================
// Signature Verification (HMAC-SHA256)
// =============================================================================

async function verifySignature(
  channelSecret: string,
  body: string,
  signature: string,
): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(channelSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
  const digest = btoa(String.fromCharCode(...new Uint8Array(sig)));

  return digest === signature;
}

// =============================================================================
// User Lookup
// =============================================================================

async function lookupLineUser(
  admin: SupabaseClient,
  lineUserId: string,
): Promise<LineUser | null> {
  const { data, error } = await admin
    .from("line_users")
    .select("*")
    .eq("line_user_id", lineUserId)
    .maybeSingle();

  if (error) {
    console.error("line_users lookup error:", error);
    return null;
  }

  return data as LineUser | null;
}

// =============================================================================
// AI Gateway Call
// =============================================================================

async function callAiGateway(
  supabaseUrl: string,
  serviceRoleKey: string,
  userId: string,
  orgId: string,
  message: string,
): Promise<GatewayResponse> {
  const gatewayUrl = `${supabaseUrl}/functions/v1/ai-gateway`;

  const res = await fetch(gatewayUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${serviceRoleKey}`,
    },
    body: JSON.stringify({
      user_id: userId,
      org_id: orgId,
      message,
      source: "line",
    }),
  });

  if (!res.ok) {
    const errBody = await res.text();
    console.error(`AI Gateway error (${res.status}): ${errBody}`);
    return {
      success: false,
      message: "AI処理でエラーが発生しました。しばらく経ってからもう一度お試しください。",
    };
  }

  return res.json();
}

// =============================================================================
// Image Handling (Receipt Photos)
// =============================================================================

async function handleImageMessage(
  admin: SupabaseClient,
  lineClient: LineClient,
  messageId: string,
  lineUser: LineUser,
  supabaseUrl: string,
  serviceRoleKey: string,
): Promise<GatewayResponse> {
  // Download image content from LINE
  let imageBuffer: ArrayBuffer;
  try {
    imageBuffer = await lineClient.getMessageContent(messageId);
  } catch (err) {
    console.error("Failed to download image from LINE:", err);
    return {
      success: false,
      message: "画像の取得に失敗しました。もう一度送信してください。",
    };
  }

  // Store image in Supabase Storage
  const timestamp = Date.now();
  const filePath = `line-receipts/${lineUser.org_id}/${lineUser.user_id}/${timestamp}_${messageId}.jpg`;

  const { error: uploadError } = await admin.storage
    .from("receipts")
    .upload(filePath, imageBuffer, {
      contentType: "image/jpeg",
      upsert: false,
    });

  if (uploadError) {
    console.error("Failed to upload receipt image:", uploadError);
    return {
      success: false,
      message: "画像の保存に失敗しました。もう一度お試しください。",
    };
  }

  // Get public URL for the uploaded image
  const { data: urlData } = admin.storage
    .from("receipts")
    .getPublicUrl(filePath);

  const receiptUrl = urlData?.publicUrl ?? filePath;

  // Forward to AI Gateway with receipt context
  const message = `領収書画像を送信しました。画像URL: ${receiptUrl}`;

  return callAiGateway(
    supabaseUrl,
    serviceRoleKey,
    lineUser.user_id,
    lineUser.org_id,
    message,
  );
}

// =============================================================================
// Quick Shortcut Detection
// =============================================================================

const QUICK_SHORTCUTS: Record<string, { domain: string; message: string }> = {
  "出勤": { domain: "hr", message: "出勤します" },
  "退勤": { domain: "hr", message: "退勤します" },
};

function isQuickShortcut(text: string): { domain: string; message: string } | null {
  const trimmed = text.trim();
  return QUICK_SHORTCUTS[trimmed] ?? null;
}

// =============================================================================
// Registration Instruction Messages
// =============================================================================

function buildRegistrationMessage(): LineMessage[] {
  return [
    {
      type: "text",
      text: [
        "AI Back Office をご利用いただくには、LINEアカウントの連携が必要です。",
        "",
        "【登録手順】",
        "1. AI Back Office のWebダッシュボードにログイン",
        "2. 設定 > LINE連携 を開く",
        "3. 表示されるQRコードをこのLINEアカウントで読み取る",
        "4. 連携完了後、このトークでメッセージを送ると業務AIが応答します",
        "",
        "ご不明な点は社内の管理者にお問い合わせください。",
      ].join("\n"),
    },
  ];
}

// =============================================================================
// Welcome Message (follow event)
// =============================================================================

function buildWelcomeMessage(): LineMessage[] {
  return [
    {
      type: "text",
      text: [
        "AI Back Office へようこそ！",
        "",
        "LINEから経費申請、出退勤打刻、顧客情報の確認などが行えます。",
        "",
        "【使い方の例】",
        '- "出勤" → 出勤打刻',
        '- "退勤" → 退勤打刻',
        '- "今月の経費一覧" → 経費確認',
        '- "山田商事の連絡先" → 顧客情報検索',
        "- 領収書の写真を送信 → 経費申請",
        "",
        "まずはWebダッシュボードからLINE連携を完了してください。",
      ].join("\n"),
    },
  ];
}

// =============================================================================
// Event Handlers
// =============================================================================

async function handleMessageEvent(
  event: LineEvent,
  admin: SupabaseClient,
  lineClient: LineClient,
  supabaseUrl: string,
  serviceRoleKey: string,
): Promise<void> {
  const lineUserId = event.source.userId;
  const replyToken = event.replyToken;

  if (!replyToken) {
    console.warn("No replyToken in message event, skipping.");
    return;
  }

  // Look up the LINE user in our database
  const lineUser = await lookupLineUser(admin, lineUserId);

  if (!lineUser) {
    // User not registered - send registration instructions
    await lineClient.reply(replyToken, buildRegistrationMessage());
    return;
  }

  const messageType = event.message?.type;

  // --- Text message ---
  if (messageType === "text" && event.message?.text) {
    const userText = event.message.text;

    // Check for quick shortcuts ("出勤", "退勤")
    const shortcut = isQuickShortcut(userText);
    const messageToSend = shortcut ? shortcut.message : userText;

    const gatewayResponse = await callAiGateway(
      supabaseUrl,
      serviceRoleKey,
      lineUser.user_id,
      lineUser.org_id,
      messageToSend,
    );

    await lineClient.reply(replyToken, [
      { type: "text", text: gatewayResponse.message },
    ]);
    return;
  }

  // --- Image message (receipt photo) ---
  if (messageType === "image" && event.message?.id) {
    const gatewayResponse = await handleImageMessage(
      admin,
      lineClient,
      event.message.id,
      lineUser,
      supabaseUrl,
      serviceRoleKey,
    );

    await lineClient.reply(replyToken, [
      { type: "text", text: gatewayResponse.message },
    ]);
    return;
  }

  // --- Unsupported message type ---
  await lineClient.reply(replyToken, [
    {
      type: "text",
      text: "テキストメッセージまたは領収書の画像を送信してください。",
    },
  ]);
}

async function handleFollowEvent(
  event: LineEvent,
  admin: SupabaseClient,
  lineClient: LineClient,
): Promise<void> {
  const replyToken = event.replyToken;
  if (!replyToken) return;

  const lineUserId = event.source.userId;

  // Check if already registered
  const lineUser = await lookupLineUser(admin, lineUserId);

  if (lineUser) {
    // Existing user - welcome back
    await lineClient.reply(replyToken, [
      {
        type: "text",
        text: `おかえりなさい！AI Back Office をご利用いただけます。\n何かお手伝いできることはありますか？`,
      },
    ]);
    return;
  }

  // New user - send welcome and registration instructions
  await lineClient.reply(replyToken, buildWelcomeMessage());
}

async function handleUnfollowEvent(
  event: LineEvent,
  admin: SupabaseClient,
): Promise<void> {
  const lineUserId = event.source.userId;

  // Log the unfollow event (do not delete the record, as they may re-follow)
  console.log(`LINE user unfollowed: ${lineUserId}`);

  // Optionally, mark the user as inactive
  const { error } = await admin
    .from("line_users")
    .update({ display_name: null }) // Clear display name as a soft indicator
    .eq("line_user_id", lineUserId);

  if (error) {
    console.error("Failed to update line_users on unfollow:", error);
  }
}

// =============================================================================
// Main Handler
// =============================================================================

serve(async (req: Request): Promise<Response> => {
  // Only accept POST
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  // ---------------------------------------------------------------------------
  // Environment variables
  // ---------------------------------------------------------------------------
  const LINE_CHANNEL_SECRET = Deno.env.get("LINE_CHANNEL_SECRET");
  const LINE_CHANNEL_ACCESS_TOKEN = Deno.env.get("LINE_CHANNEL_ACCESS_TOKEN");
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (
    !LINE_CHANNEL_SECRET ||
    !LINE_CHANNEL_ACCESS_TOKEN ||
    !SUPABASE_URL ||
    !SUPABASE_SERVICE_ROLE_KEY
  ) {
    console.error("Missing required environment variables");
    return new Response(
      JSON.stringify({ error: "Server configuration error" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  // ---------------------------------------------------------------------------
  // Verify LINE webhook signature
  // ---------------------------------------------------------------------------
  const rawBody = await req.text();
  const signature = req.headers.get("x-line-signature") ?? "";

  if (!signature) {
    return new Response(
      JSON.stringify({ error: "Missing X-Line-Signature header" }),
      { status: 401, headers: { "Content-Type": "application/json" } },
    );
  }

  const isValid = await verifySignature(LINE_CHANNEL_SECRET, rawBody, signature);
  if (!isValid) {
    console.error("Invalid LINE webhook signature");
    return new Response(
      JSON.stringify({ error: "Invalid signature" }),
      { status: 401, headers: { "Content-Type": "application/json" } },
    );
  }

  // ---------------------------------------------------------------------------
  // Parse webhook body
  // ---------------------------------------------------------------------------
  let body: LineWebhookBody;
  try {
    body = JSON.parse(rawBody) as LineWebhookBody;
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid JSON body" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  // LINE sends a verification request with empty events array
  if (!body.events || body.events.length === 0) {
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  // ---------------------------------------------------------------------------
  // Initialize clients
  // ---------------------------------------------------------------------------
  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const lineClient = new LineClient(LINE_CHANNEL_ACCESS_TOKEN);

  // ---------------------------------------------------------------------------
  // Process events (LINE may batch multiple events in one request)
  // ---------------------------------------------------------------------------
  const results = await Promise.allSettled(
    body.events.map(async (event) => {
      try {
        switch (event.type) {
          case "message":
            await handleMessageEvent(
              event,
              admin,
              lineClient,
              SUPABASE_URL,
              SUPABASE_SERVICE_ROLE_KEY,
            );
            break;

          case "follow":
            await handleFollowEvent(event, admin, lineClient);
            break;

          case "unfollow":
            await handleUnfollowEvent(event, admin);
            break;

          default:
            console.log(`Unhandled event type: ${event.type}`);
        }
      } catch (err) {
        console.error(`Error processing ${event.type} event:`, err);
        // Try to reply with error message if we have a reply token
        if (event.replyToken) {
          try {
            await lineClient.reply(event.replyToken, [
              {
                type: "text",
                text: "申し訳ございません。処理中にエラーが発生しました。しばらく経ってからもう一度お試しください。",
              },
            ]);
          } catch (replyErr) {
            console.error("Failed to send error reply:", replyErr);
          }
        }
      }
    }),
  );

  // Log any rejected promises
  for (const result of results) {
    if (result.status === "rejected") {
      console.error("Event processing rejected:", result.reason);
    }
  }

  // LINE expects a 200 response; non-200 causes retries
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
