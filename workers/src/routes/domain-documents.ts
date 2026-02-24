import { neon } from '@neondatabase/serverless'
import type { Env } from '../lib/db'

type Sql = ReturnType<typeof neon>

export async function handleDocuments(sql: Sql, env: Env, orgId: string, userId: string, action: string, params: Record<string, any>) {
  switch (action) {
    case 'search_documents': {
      const { query } = params
      if (!query) return { message: '検索キーワードを指定してください', data: null }

      const rows = await sql`
        SELECT id, title, category, version, created_at
        FROM documents WHERE org_id = ${orgId}::uuid
          AND (title ILIKE ${'%' + query + '%'} OR content ILIKE ${'%' + query + '%'})
        ORDER BY created_at DESC LIMIT 20
      `
      return { message: `文書検索「${query}」: ${rows.length}件`, data: rows }
    }

    case 'get_document': {
      const { document_id } = params
      if (!document_id) return { message: '文書IDを指定してください', data: null }

      const rows = await sql`
        SELECT id, title, category, content, file_url, version, created_at
        FROM documents WHERE id = ${document_id}::uuid AND org_id = ${orgId}::uuid
      `
      if (rows.length === 0) return { message: '文書が見つかりません', data: null }
      return { message: `文書「${rows[0].title}」`, data: rows[0] }
    }

    case 'create_document': {
      const { title, category, content } = params
      if (!title) return { message: 'タイトルは必須です', data: null }

      const rows = await sql`
        INSERT INTO documents (org_id, title, category, content, created_by)
        VALUES (${orgId}::uuid, ${title}, ${category || 'other'}::document_category, ${content || ''}, ${userId}::uuid)
        RETURNING id, title
      `
      return { message: `文書「${title}」を作成しました`, data: rows[0] }
    }

    case 'get_templates': {
      const rows = await sql`
        SELECT id, name, category, variables
        FROM templates WHERE org_id = ${orgId}::uuid
        ORDER BY name
      `
      return { message: `テンプレート一覧: ${rows.length}件`, data: rows }
    }

    case 'generate_from_template': {
      const { template_id, variables } = params
      if (!template_id) return { message: 'テンプレートIDを指定してください', data: null }

      const tmpl = await sql`
        SELECT name, content_template, variables as var_defs
        FROM templates WHERE id = ${template_id}::uuid AND org_id = ${orgId}::uuid
      `
      if (tmpl.length === 0) return { message: 'テンプレートが見つかりません', data: null }

      let content = tmpl[0].content_template
      if (variables && typeof variables === 'object') {
        for (const [key, value] of Object.entries(variables)) {
          content = content.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), String(value))
        }
      }

      const doc = await sql`
        INSERT INTO documents (org_id, title, category, content, created_by)
        VALUES (${orgId}::uuid, ${`${tmpl[0].name} - 生成`}, 'other'::document_category, ${content}, ${userId}::uuid)
        RETURNING id, title
      `
      return { message: `テンプレート「${tmpl[0].name}」から文書を生成しました`, data: { ...doc[0], content } }
    }

    default:
      return { message: `文書アクション「${action}」は未対応です`, data: null }
  }
}
