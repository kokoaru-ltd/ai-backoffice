import { neon } from '@neondatabase/serverless'
import type { Env } from '../lib/db'

type Sql = ReturnType<typeof neon>

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'Asia/Tokyo' })
}

const categoryLabels: Record<string, string> = {
  contract: '📜 契約書', manual: '📖 マニュアル', policy: '📋 規程',
  report: '📊 レポート', template: '📄 テンプレート', other: '📁 その他'
}

export async function handleDocuments(sql: Sql, env: Env, orgId: string, userId: string, action: string, params: Record<string, any>) {
  switch (action) {
    case 'search_documents': {
      const { query } = params
      if (!query) return { message: '⚠️ 検索キーワードを指定してください\n\n例: 「就業規則を検索」「契約書テンプレート」', data: null }

      const rows = await sql`
        SELECT id, title, category, version, created_at, file_url
        FROM documents WHERE org_id = ${orgId}::uuid
          AND (title ILIKE ${'%' + query + '%'} OR content ILIKE ${'%' + query + '%'})
        ORDER BY created_at DESC LIMIT 20
      `

      // Category breakdown
      const catCounts = new Map<string, number>()
      rows.forEach((r: any) => {
        catCounts.set(r.category, (catCounts.get(r.category) || 0) + 1)
      })

      let msg = `🔍 文書検索「${query}」\n━━━━━━━━━━━━━\n`
      msg += `ヒット: ${rows.length}件\n`

      if (catCounts.size > 0) {
        msg += `\n【カテゴリ別】\n`
        catCounts.forEach((count, cat) => {
          msg += `  ${categoryLabels[cat] || cat}: ${count}件\n`
        })
      }

      msg += `\n【検索結果】\n`
      rows.forEach((r: any, i: number) => {
        const catIcon = categoryLabels[r.category]?.slice(0, 2) || '📁'
        msg += `${i + 1}. ${catIcon} ${r.title}\n`
        msg += `   ver.${r.version || 1} | ${fmtDate(r.created_at)}\n`
        if (r.file_url) msg += `   📎 ファイル添付あり\n`
      })

      if (rows.length === 0) {
        msg += `\n該当する文書が見つかりませんでした。\nキーワードを変えて検索してみてください。`
      }

      return { message: msg, data: rows }
    }

    case 'get_document': {
      const { document_id } = params
      if (!document_id) return { message: '⚠️ 文書IDを指定してください', data: null }

      const rows = await sql`
        SELECT d.id, d.title, d.category, d.content, d.file_url, d.version, d.created_at,
               u.full_name as author
        FROM documents d
        LEFT JOIN user_profiles u ON d.created_by = u.id
        WHERE d.id = ${document_id}::uuid AND d.org_id = ${orgId}::uuid
      `
      if (rows.length === 0) return { message: '⚠️ 文書が見つかりません', data: null }

      const doc = rows[0]
      const catLabel = categoryLabels[doc.category] || doc.category

      let msg = `📄 文書詳細\n━━━━━━━━━━━━━\n`
      msg += `タイトル: ${doc.title}\n`
      msg += `カテゴリ: ${catLabel}\n`
      msg += `バージョン: ${doc.version || 1}\n`
      msg += `作成日: ${fmtDate(doc.created_at)}\n`
      if (doc.author) msg += `作成者: ${doc.author}\n`
      if (doc.file_url) msg += `📎 ファイル: 添付あり\n`

      if (doc.content) {
        const preview = doc.content.length > 300 ? doc.content.slice(0, 300) + '...' : doc.content
        msg += `\n【内容プレビュー】\n${preview}`
      }

      return { message: msg, data: doc }
    }

    case 'create_document': {
      const { title, category, content } = params
      if (!title) return { message: '⚠️ タイトルは必須です\n\n例: 「新規文書 営業マニュアル」', data: null }

      const rows = await sql`
        INSERT INTO documents (org_id, title, category, content, created_by)
        VALUES (${orgId}::uuid, ${title}, ${category || 'other'}::document_category, ${content || ''}, ${userId}::uuid)
        RETURNING id, title, created_at
      `

      const totalDocs = await sql`
        SELECT COUNT(*) as count FROM documents WHERE org_id = ${orgId}::uuid
      `

      const catLabel = categoryLabels[category || 'other'] || category || 'その他'

      let msg = `✅ 文書を作成しました\n━━━━━━━━━━━━━\n`
      msg += `タイトル: ${title}\n`
      msg += `カテゴリ: ${catLabel}\n`
      msg += `バージョン: 1\n`
      msg += `作成日: ${fmtDate(rows[0].created_at)}\n`
      if (content) msg += `内容: ${content.length}文字\n`
      msg += `\n総文書数: ${totalDocs[0].count}件`

      return { message: msg, data: rows[0] }
    }

    case 'get_templates': {
      const rows = await sql`
        SELECT id, name, category, variables
        FROM templates WHERE org_id = ${orgId}::uuid
        ORDER BY name
      `

      let msg = `📑 テンプレート一覧\n━━━━━━━━━━━━━\n`
      msg += `登録数: ${rows.length}件\n\n`

      rows.forEach((r: any, i: number) => {
        const catLabel = categoryLabels[r.category]?.slice(0, 2) || '📁'
        msg += `${i + 1}. ${catLabel} ${r.name}\n`
        if (r.variables) {
          const vars = typeof r.variables === 'string' ? JSON.parse(r.variables) : r.variables
          if (Array.isArray(vars) && vars.length > 0) {
            msg += `   変数: ${vars.join(', ')}\n`
          }
        }
      })

      if (rows.length === 0) {
        msg += `テンプレートが登録されていません。\n管理者にテンプレートの追加を依頼してください。`
      }

      return { message: msg, data: rows }
    }

    case 'generate_from_template': {
      const { template_id, variables } = params
      if (!template_id) return { message: '⚠️ テンプレートIDを指定してください', data: null }

      const tmpl = await sql`
        SELECT name, content_template, variables as var_defs
        FROM templates WHERE id = ${template_id}::uuid AND org_id = ${orgId}::uuid
      `
      if (tmpl.length === 0) return { message: '⚠️ テンプレートが見つかりません', data: null }

      let content = tmpl[0].content_template
      const replacedVars: string[] = []
      if (variables && typeof variables === 'object') {
        for (const [key, value] of Object.entries(variables)) {
          content = content.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), String(value))
          replacedVars.push(`${key}: ${value}`)
        }
      }

      const doc = await sql`
        INSERT INTO documents (org_id, title, category, content, created_by)
        VALUES (${orgId}::uuid, ${`${tmpl[0].name} - 生成`}, 'other'::document_category, ${content}, ${userId}::uuid)
        RETURNING id, title, created_at
      `

      let msg = `✅ テンプレートから文書を生成\n━━━━━━━━━━━━━\n`
      msg += `テンプレート: ${tmpl[0].name}\n`
      msg += `文書名: ${doc[0].title}\n`
      msg += `作成日: ${fmtDate(doc[0].created_at)}\n`

      if (replacedVars.length > 0) {
        msg += `\n【適用した変数】\n`
        replacedVars.forEach(v => {
          msg += `  • ${v}\n`
        })
      }

      // Preview
      const preview = content.length > 200 ? content.slice(0, 200) + '...' : content
      msg += `\n【内容プレビュー】\n${preview}`

      return { message: msg, data: { ...doc[0], content } }
    }

    default:
      return { message: `⚠️ 文書アクション「${action}」は未対応です`, data: null }
  }
}
