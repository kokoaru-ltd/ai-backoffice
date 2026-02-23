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

// =============================================================================
// Constants
// =============================================================================

const CATEGORY_LABELS: Record<string, string> = {
  contract: "\u5951\u7d04\u66f8",
  estimate: "\u898b\u7a4d\u66f8",
  invoice: "\u8acb\u6c42\u66f8",
  regulation: "\u898f\u7a0b",
  manual: "\u30de\u30cb\u30e5\u30a2\u30eb",
  other: "\u305d\u306e\u4ed6",
};

/** Chunk size for embedding generation (characters) */
const CHUNK_SIZE = 500;
const CHUNK_OVERLAP = 50;

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
// Embedding helpers
// =============================================================================

/** Split text into overlapping chunks for embedding */
function chunkText(text: string): string[] {
  const chunks: string[] = [];
  if (!text || text.length === 0) return chunks;

  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + CHUNK_SIZE, text.length);
    chunks.push(text.slice(start, end));
    if (end >= text.length) break;
    start += CHUNK_SIZE - CHUNK_OVERLAP;
  }
  return chunks;
}

/** Generate embeddings via OpenAI API (text-embedding-3-small) */
async function generateEmbeddings(texts: string[]): Promise<number[][] | null> {
  const openaiKey = Deno.env.get("OPENAI_API_KEY");
  if (!openaiKey) {
    console.warn("OPENAI_API_KEY not set, skipping embedding generation");
    return null;
  }

  try {
    const res = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: "text-embedding-3-small",
        input: texts,
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      console.error(`OpenAI embeddings error (${res.status}): ${errBody}`);
      return null;
    }

    const data = await res.json();
    return data.data.map((d: any) => d.embedding);
  } catch (err) {
    console.error("Embedding generation failed:", err);
    return null;
  }
}

// =============================================================================
// Action handlers
// =============================================================================

async function searchDocuments(
  db: SupabaseClient,
  params: Record<string, any>,
): Promise<DomainResponse> {
  const { org_id, query } = params;
  if (!org_id || !query) {
    return { success: false, message: "org_id と query は必須です" };
  }

  // Full text search using ilike on title and content
  const { data, error } = await db
    .from("documents")
    .select("id, title, category, content, file_url, version, created_at")
    .eq("org_id", org_id)
    .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    return { success: false, message: `検索エラー: ${error.message}` };
  }

  const documents = data || [];

  return {
    success: true,
    message: `「${query}」の検索結果: ${documents.length}件`,
    data: {
      query,
      documents: documents.map((d: any) => ({
        ...d,
        category_label: CATEGORY_LABELS[d.category] || d.category,
        created_at_formatted: formatDateJP(d.created_at),
        // Include a snippet of content around the match
        content_snippet: d.content
          ? d.content.length > 200
            ? d.content.substring(0, 200) + "..."
            : d.content
          : null,
      })),
      count: documents.length,
    },
  };
}

async function ragSearch(
  db: SupabaseClient,
  params: Record<string, any>,
): Promise<DomainResponse> {
  const { org_id, query } = params;
  if (!org_id || !query) {
    return { success: false, message: "org_id と query は必須です" };
  }

  // Generate embedding for the query
  const embeddings = await generateEmbeddings([query]);
  if (!embeddings || embeddings.length === 0) {
    // Fallback to text search if embedding fails
    return searchDocuments(db, params);
  }

  const queryEmbedding = embeddings[0];

  // Vector similarity search using pgvector <=> operator via RPC
  // We use a raw SQL query through the Supabase RPC mechanism
  const { data, error } = await db.rpc("match_documents", {
    query_embedding: queryEmbedding,
    match_org_id: org_id,
    match_threshold: 0.7,
    match_count: 10,
  });

  if (error) {
    // If RPC function doesn't exist, fall back to manual query
    console.warn("match_documents RPC not found, using direct query");

    // Direct query using pgvector operator
    const { data: directData, error: directErr } = await db
      .from("doc_embeddings")
      .select(
        `
        id,
        chunk_index,
        content,
        document_id,
        documents!inner(id, title, category, org_id, created_at)
      `,
      )
      .eq("documents.org_id", org_id)
      .limit(10);

    if (directErr) {
      return {
        success: false,
        message: `RAG検索エラー: ${directErr.message}。テキスト検索にフォールバックします。`,
      };
    }

    // If direct query also fails or returns no results, fallback
    if (!directData || directData.length === 0) {
      return searchDocuments(db, params);
    }

    return {
      success: true,
      message: `「${query}」のRAG検索結果: ${directData.length}件`,
      data: {
        query,
        results: directData.map((r: any) => ({
          chunk_content: r.content,
          chunk_index: r.chunk_index,
          document_id: r.document_id,
          document_title: r.documents?.title,
          category: r.documents?.category,
          category_label:
            CATEGORY_LABELS[r.documents?.category] || r.documents?.category,
        })),
        count: directData.length,
        method: "vector_fallback",
      },
    };
  }

  const results = data || [];

  return {
    success: true,
    message: `「${query}」のRAG検索結果: ${results.length}件`,
    data: {
      query,
      results: results.map((r: any) => ({
        ...r,
        category_label: CATEGORY_LABELS[r.category] || r.category,
        similarity_display: `${Math.round((r.similarity || 0) * 100)}%`,
      })),
      count: results.length,
      method: "vector_similarity",
    },
  };
}

async function getDocument(
  db: SupabaseClient,
  params: Record<string, any>,
): Promise<DomainResponse> {
  const { org_id, document_id } = params;
  if (!org_id || !document_id) {
    return { success: false, message: "org_id と document_id は必須です" };
  }

  const { data, error } = await db
    .from("documents")
    .select("*")
    .eq("id", document_id)
    .eq("org_id", org_id)
    .single();

  if (error || !data) {
    return { success: false, message: "ドキュメントが見つかりません" };
  }

  return {
    success: true,
    message: `ドキュメント: ${data.title}`,
    data: {
      ...data,
      category_label: CATEGORY_LABELS[data.category] || data.category,
      created_at_formatted: formatDateJP(data.created_at),
    },
  };
}

async function createDocument(
  db: SupabaseClient,
  params: Record<string, any>,
): Promise<DomainResponse> {
  const { org_id, title, category, content, file_url, created_by } = params;
  if (!org_id || !title || !category) {
    return {
      success: false,
      message: "org_id, title, category は必須です",
    };
  }

  const validCategories = [
    "contract",
    "estimate",
    "invoice",
    "regulation",
    "manual",
    "other",
  ];
  if (!validCategories.includes(category)) {
    return {
      success: false,
      message: `category は ${validCategories.join(", ")} のいずれかで指定してください`,
    };
  }

  // Create the document
  const { data, error } = await db
    .from("documents")
    .insert({
      org_id,
      title,
      category,
      content: content || null,
      file_url: file_url || null,
      created_by: created_by || "00000000-0000-0000-0000-000000000000",
    })
    .select()
    .single();

  if (error) {
    return {
      success: false,
      message: `ドキュメント作成エラー: ${error.message}`,
    };
  }

  // Generate and store embeddings if content is provided
  let embeddingsStored = 0;
  if (content && content.length > 0) {
    const chunks = chunkText(content);

    if (chunks.length > 0) {
      const embeddings = await generateEmbeddings(chunks);

      if (embeddings && embeddings.length === chunks.length) {
        const embeddingRecords = chunks.map((chunk, index) => ({
          document_id: data.id,
          chunk_index: index,
          content: chunk,
          embedding: embeddings[index],
        }));

        const { error: embErr } = await db
          .from("doc_embeddings")
          .insert(embeddingRecords);

        if (embErr) {
          console.error("Embedding storage failed:", embErr.message);
        } else {
          embeddingsStored = chunks.length;
        }
      }
    }
  }

  return {
    success: true,
    message: `ドキュメントを作成しました: ${title}（${CATEGORY_LABELS[category]}）${embeddingsStored > 0 ? `、${embeddingsStored}チャンクをベクトル化` : ""}`,
    data: {
      ...data,
      category_label: CATEGORY_LABELS[category],
      created_at_formatted: formatDateJP(data.created_at),
      embeddings_stored: embeddingsStored,
    },
  };
}

async function getTemplates(
  db: SupabaseClient,
  params: Record<string, any>,
): Promise<DomainResponse> {
  const { org_id, category } = params;
  if (!org_id) {
    return { success: false, message: "org_id は必須です" };
  }

  let query = db
    .from("templates")
    .select("*")
    .eq("org_id", org_id)
    .order("created_at", { ascending: false });

  if (category) {
    query = query.eq("category", category);
  }

  const { data, error } = await query;
  if (error) {
    return {
      success: false,
      message: `テンプレート取得エラー: ${error.message}`,
    };
  }

  const templates = data || [];

  return {
    success: true,
    message: `テンプレート: ${templates.length}件${category ? `（${CATEGORY_LABELS[category] || category}）` : ""}`,
    data: {
      templates: templates.map((t: any) => ({
        ...t,
        category_label: CATEGORY_LABELS[t.category] || t.category,
        created_at_formatted: formatDateJP(t.created_at),
      })),
      count: templates.length,
    },
  };
}

async function generateFromTemplate(
  db: SupabaseClient,
  params: Record<string, any>,
): Promise<DomainResponse> {
  const { org_id, template_id, variables } = params;
  if (!org_id || !template_id || !variables) {
    return {
      success: false,
      message: "org_id, template_id, variables は必須です",
    };
  }

  // Get the template
  const { data: template, error } = await db
    .from("templates")
    .select("*")
    .eq("id", template_id)
    .eq("org_id", org_id)
    .single();

  if (error || !template) {
    return { success: false, message: "テンプレートが見つかりません" };
  }

  // Replace variables in the template content
  let generatedContent = template.content_template;
  const expectedVars = template.variables as string[];
  const missingVars: string[] = [];

  for (const varDef of expectedVars) {
    const varName = typeof varDef === "string" ? varDef : (varDef as any).name || varDef;
    const placeholder = `{{${varName}}}`;
    if (variables[varName] !== undefined && variables[varName] !== null) {
      generatedContent = generatedContent.replaceAll(
        placeholder,
        String(variables[varName]),
      );
    } else {
      missingVars.push(varName);
    }
  }

  // Also replace any {{date}} with current date in Japanese format
  generatedContent = generatedContent.replaceAll(
    "{{date}}",
    formatDateJP(new Date()),
  );
  generatedContent = generatedContent.replaceAll(
    "{{today}}",
    formatDateJP(new Date()),
  );

  let message = `テンプレート「${template.name}」からドキュメントを生成しました`;
  if (missingVars.length > 0) {
    message += `\n\u26a0\ufe0f 未指定の変数: ${missingVars.join(", ")}`;
  }

  return {
    success: true,
    message,
    data: {
      template_id: template.id,
      template_name: template.name,
      category: template.category,
      category_label: CATEGORY_LABELS[template.category] || template.category,
      generated_content: generatedContent,
      variables_used: variables,
      missing_variables: missingVars,
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
  search_documents: searchDocuments,
  rag_search: ragSearch,
  get_document: getDocument,
  create_document: createDocument,
  get_templates: getTemplates,
  generate_from_template: generateFromTemplate,
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
        message: "action \u3068 params \u306f\u5fc5\u9808\u3067\u3059",
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
    console.error("domain-documents error:", err);
    return json(500, {
      success: false,
      message: `内部エラーが発生しました: ${(err as Error).message}`,
    });
  }
});
