import { neon } from '@neondatabase/serverless'
import type { Env } from '../lib/db'

type Sql = ReturnType<typeof neon>

function yen(n: number) { return `¥${n.toLocaleString()}` }

const stageLabels: Record<string, string> = {
  lead: 'リード', proposal: '提案', negotiation: '交渉中',
  closed_won: '受注', closed_lost: '失注'
}
const stageIcons: Record<string, string> = {
  lead: '🔵', proposal: '🟡', negotiation: '🟠',
  closed_won: '🟢', closed_lost: '🔴'
}

export async function handleCRM(sql: Sql, env: Env, orgId: string, userId: string, action: string, params: Record<string, any>) {
  switch (action) {
    case 'get_contacts': {
      const search = params.search || ''
      const rows = search
        ? await sql`
            SELECT id, company_name, contact_name, email, phone, tags
            FROM contacts WHERE org_id = ${orgId}::uuid
              AND (company_name ILIKE ${'%' + search + '%'} OR contact_name ILIKE ${'%' + search + '%'})
            ORDER BY created_at DESC LIMIT 20
          `
        : await sql`
            SELECT id, company_name, contact_name, email, phone, tags
            FROM contacts WHERE org_id = ${orgId}::uuid
            ORDER BY created_at DESC LIMIT 20
          `

      // Get deal counts per contact
      const dealCounts = await sql`
        SELECT contact_id, COUNT(*) as count, COALESCE(SUM(amount), 0) as total
        FROM deals WHERE org_id = ${orgId}::uuid AND contact_id IS NOT NULL
        GROUP BY contact_id
      `
      const dealMap = new Map(dealCounts.map((r: any) => [r.contact_id, r]))

      let msg = `👥 顧客一覧${search ? ` (検索: ${search})` : ''}\n━━━━━━━━━━━━━\n`
      msg += `登録数: ${rows.length}件\n\n`

      rows.forEach((r: any, i: number) => {
        const deals = dealMap.get(r.id)
        msg += `${i + 1}. ${r.company_name || '（個人）'}\n`
        msg += `   担当: ${r.contact_name}\n`
        if (r.phone) msg += `   📞 ${r.phone}\n`
        if (r.email) msg += `   📧 ${r.email}\n`
        if (deals) msg += `   💼 商談${deals.count}件 (${yen(Number(deals.total))})\n`
        if (r.tags && r.tags.length > 0) msg += `   🏷 ${r.tags.join(', ')}\n`
        msg += `\n`
      })

      return { message: msg, data: rows }
    }

    case 'create_contact': {
      const { company_name, contact_name, email, phone } = params
      if (!contact_name) return { message: '⚠️ 担当者名は必須です\n\n例: 「新規顧客 山田太郎 株式会社ABC 090-1234-5678」', data: null }

      const rows = await sql`
        INSERT INTO contacts (org_id, company_name, contact_name, email, phone)
        VALUES (${orgId}::uuid, ${company_name || null}, ${contact_name}, ${email || null}, ${phone || null})
        RETURNING id, contact_name, created_at
      `

      const totalContacts = await sql`
        SELECT COUNT(*) as count FROM contacts WHERE org_id = ${orgId}::uuid
      `

      let msg = `✅ 顧客を登録しました\n━━━━━━━━━━━━━\n`
      msg += `担当者: ${contact_name}\n`
      if (company_name) msg += `会社名: ${company_name}\n`
      if (email) msg += `📧 ${email}\n`
      if (phone) msg += `📞 ${phone}\n`
      msg += `\n総登録顧客数: ${totalContacts[0].count}件`

      return { message: msg, data: rows[0] }
    }

    case 'get_deals': {
      const stage = params.stage || null
      const rows = stage
        ? await sql`
            SELECT d.id, d.title, d.amount, d.stage, d.expected_close_date, c.contact_name, c.company_name
            FROM deals d LEFT JOIN contacts c ON d.contact_id = c.id
            WHERE d.org_id = ${orgId}::uuid AND d.stage = ${stage}::deal_stage
            ORDER BY d.amount DESC LIMIT 20
          `
        : await sql`
            SELECT d.id, d.title, d.amount, d.stage, d.expected_close_date, c.contact_name, c.company_name
            FROM deals d LEFT JOIN contacts c ON d.contact_id = c.id
            WHERE d.org_id = ${orgId}::uuid
            ORDER BY d.created_at DESC LIMIT 20
          `

      // Pipeline summary
      const pipeline = await sql`
        SELECT stage, COUNT(*) as count, COALESCE(SUM(amount), 0) as total
        FROM deals WHERE org_id = ${orgId}::uuid
        GROUP BY stage ORDER BY count DESC
      `

      const totalAmount = rows.reduce((sum: number, r: any) => sum + Number(r.amount), 0)
      const activeAmount = pipeline
        .filter((r: any) => !['closed_won', 'closed_lost'].includes(r.stage))
        .reduce((sum: number, r: any) => sum + Number(r.total), 0)

      let msg = `💼 商談一覧${stage ? ` (${stageLabels[stage] || stage})` : ''}\n━━━━━━━━━━━━━\n`
      msg += `件数: ${rows.length}件 / 金額: ${yen(totalAmount)}\n`
      msg += `パイプライン: ${yen(activeAmount)}\n\n`

      // Pipeline breakdown
      msg += `【パイプライン】\n`
      pipeline.forEach((r: any) => {
        const icon = stageIcons[r.stage] || '⚪'
        msg += `${icon} ${stageLabels[r.stage] || r.stage}: ${r.count}件 ${yen(Number(r.total))}\n`
      })

      msg += `\n【商談リスト】\n`
      rows.slice(0, 10).forEach((r: any, i: number) => {
        const icon = stageIcons[r.stage] || '⚪'
        msg += `${icon} ${r.title}\n`
        msg += `   ${r.company_name || r.contact_name || '未設定'} | ${yen(Number(r.amount))}\n`
        if (r.expected_close_date) msg += `   締切: ${new Date(r.expected_close_date).toISOString().slice(0, 10)}\n`
      })

      return { message: msg, data: rows }
    }

    case 'create_deal': {
      const { title, contact_id, amount } = params
      if (!title) return { message: '⚠️ 商談名は必須です\n\n例: 「新規商談 ABCシステム導入 500万」', data: null }

      const rows = await sql`
        INSERT INTO deals (org_id, contact_id, title, amount, assigned_to)
        VALUES (${orgId}::uuid, ${contact_id || null}, ${title}, ${Number(amount) || 0}, ${userId}::uuid)
        RETURNING id, title, stage
      `

      // Get contact info if available
      let contactInfo = ''
      if (contact_id) {
        const contact = await sql`SELECT contact_name, company_name FROM contacts WHERE id = ${contact_id}::uuid`
        if (contact.length > 0) contactInfo = `顧客: ${contact[0].company_name || contact[0].contact_name}\n`
      }

      let msg = `✅ 商談を作成しました\n━━━━━━━━━━━━━\n`
      msg += `商談名: ${title}\n`
      if (contactInfo) msg += contactInfo
      msg += `金額: ${yen(Number(amount) || 0)}\n`
      msg += `ステージ: ${stageIcons.lead} リード\n`
      msg += `担当: あなた`

      return { message: msg, data: rows[0] }
    }

    case 'update_deal_stage': {
      const { deal_id, stage } = params
      if (!deal_id || !stage) return { message: '⚠️ 商談IDとステージは必須です', data: null }

      const before = await sql`
        SELECT d.title, d.stage as old_stage, d.amount, c.company_name
        FROM deals d LEFT JOIN contacts c ON d.contact_id = c.id
        WHERE d.id = ${deal_id}::uuid AND d.org_id = ${orgId}::uuid
      `

      await sql`
        UPDATE deals SET stage = ${stage}::deal_stage
        WHERE id = ${deal_id}::uuid AND org_id = ${orgId}::uuid
      `

      const d = before[0]
      const oldIcon = stageIcons[d?.old_stage] || '⚪'
      const newIcon = stageIcons[stage] || '⚪'

      let msg = `✅ 商談ステージ更新\n━━━━━━━━━━━━━\n`
      msg += `商談: ${d?.title || deal_id}\n`
      if (d?.company_name) msg += `顧客: ${d.company_name}\n`
      msg += `金額: ${yen(Number(d?.amount || 0))}\n\n`
      msg += `${oldIcon} ${stageLabels[d?.old_stage] || d?.old_stage} → ${newIcon} ${stageLabels[stage] || stage}`

      if (stage === 'closed_won') msg += `\n\n🎉 受注おめでとうございます！`
      if (stage === 'closed_lost') msg += `\n\n次の商談に活かしましょう`

      return { message: msg, data: { deal_id, stage } }
    }

    case 'log_interaction': {
      const { contact_id, type, summary } = params
      if (!contact_id || !type || !summary) return { message: '⚠️ 顧客ID、種別、概要は必須です', data: null }

      const rows = await sql`
        INSERT INTO interactions (org_id, contact_id, type, summary, created_by)
        VALUES (${orgId}::uuid, ${contact_id}::uuid, ${type}::interaction_type, ${summary}, ${userId}::uuid)
        RETURNING id, created_at
      `

      const contact = await sql`SELECT contact_name, company_name FROM contacts WHERE id = ${contact_id}::uuid`
      const typeLabels: Record<string, string> = {
        call: '📞 電話', email: '📧 メール', meeting: '🤝 商談', note: '📝 メモ'
      }

      // Count total interactions
      const stats = await sql`
        SELECT type, COUNT(*) as count FROM interactions
        WHERE contact_id = ${contact_id}::uuid GROUP BY type
      `

      let msg = `✅ 対応記録を追加\n━━━━━━━━━━━━━\n`
      msg += `顧客: ${contact[0]?.company_name || contact[0]?.contact_name || contact_id}\n`
      msg += `種別: ${typeLabels[type] || type}\n`
      msg += `内容: ${summary}\n\n`
      msg += `📊 対応履歴サマリー\n`
      stats.forEach((r: any) => {
        msg += `  ${typeLabels[r.type] || r.type}: ${r.count}回\n`
      })

      return { message: msg, data: rows[0] }
    }

    case 'get_sales_report': {
      const period = params.period || new Date().toISOString().slice(0, 7)
      const won = await sql`
        SELECT COALESCE(SUM(amount), 0) as total, COUNT(*) as count
        FROM deals WHERE org_id = ${orgId}::uuid AND stage = 'closed_won'
          AND to_char(created_at, 'YYYY-MM') = ${period}
      `
      const lost = await sql`
        SELECT COUNT(*) as count
        FROM deals WHERE org_id = ${orgId}::uuid AND stage = 'closed_lost'
          AND to_char(created_at, 'YYYY-MM') = ${period}
      `
      const pipeline = await sql`
        SELECT stage, COUNT(*) as count, COALESCE(SUM(amount), 0) as total
        FROM deals WHERE org_id = ${orgId}::uuid AND stage NOT IN ('closed_won', 'closed_lost')
        GROUP BY stage ORDER BY total DESC
      `
      const pipelineTotal = pipeline.reduce((sum: number, r: any) => sum + Number(r.total), 0)

      // Top deals
      const topDeals = await sql`
        SELECT d.title, d.amount, d.stage, c.company_name
        FROM deals d LEFT JOIN contacts c ON d.contact_id = c.id
        WHERE d.org_id = ${orgId}::uuid AND d.stage NOT IN ('closed_lost')
        ORDER BY d.amount DESC LIMIT 5
      `

      const wonCount = Number(won[0].count)
      const lostCount = Number(lost[0].count)
      const winRate = (wonCount + lostCount) > 0 ? Math.round((wonCount / (wonCount + lostCount)) * 100) : 0

      let msg = `📊 ${period} 営業レポート\n━━━━━━━━━━━━━\n\n`
      msg += `🟢 受注: ${yen(Number(won[0].total))} (${wonCount}件)\n`
      msg += `🔴 失注: ${lostCount}件\n`
      msg += `📈 勝率: ${winRate}%\n`
      msg += `💰 パイプライン: ${yen(pipelineTotal)}\n\n`

      if (pipeline.length > 0) {
        msg += `【進行中案件】\n`
        pipeline.forEach((r: any) => {
          const icon = stageIcons[r.stage] || '⚪'
          msg += `${icon} ${stageLabels[r.stage] || r.stage}: ${r.count}件 ${yen(Number(r.total))}\n`
        })
        msg += `\n`
      }

      if (topDeals.length > 0) {
        msg += `【注目案件 TOP5】\n`
        topDeals.forEach((r: any, i: number) => {
          const icon = stageIcons[r.stage] || '⚪'
          msg += `${i + 1}. ${icon} ${r.title} ${yen(Number(r.amount))}\n`
          if (r.company_name) msg += `   ${r.company_name}\n`
        })
      }

      return { message: msg, data: { won: won[0], pipeline } }
    }

    case 'get_teleapo_schedule': {
      const rows = await sql`
        SELECT tc.id, tc.status, tc.scheduled_at, tc.notes, c.contact_name, c.company_name, c.phone
        FROM teleapo_calls tc
        JOIN contacts c ON tc.contact_id = c.id
        WHERE tc.org_id = ${orgId}::uuid AND tc.status IN ('scheduled', 'callback')
        ORDER BY tc.scheduled_at ASC LIMIT 20
      `

      const scheduled = rows.filter((r: any) => r.status === 'scheduled')
      const callback = rows.filter((r: any) => r.status === 'callback')

      let msg = `📞 テレアポ予定\n━━━━━━━━━━━━━\n`
      msg += `予定: ${scheduled.length}件 / コールバック: ${callback.length}件\n\n`

      if (callback.length > 0) {
        msg += `🔔 コールバック（優先）\n`
        callback.forEach((r: any) => {
          msg += `  📞 ${r.company_name || r.contact_name}\n`
          msg += `     ${r.phone || '番号なし'}\n`
          if (r.notes) msg += `     メモ: ${r.notes}\n`
          msg += `\n`
        })
      }

      if (scheduled.length > 0) {
        msg += `📋 本日の架電リスト\n`
        scheduled.forEach((r: any, i: number) => {
          msg += `${i + 1}. ${r.company_name || r.contact_name}\n`
          msg += `   📞 ${r.phone || '番号なし'}\n`
          if (r.notes) msg += `   💬 ${r.notes}\n`
        })
      }

      if (rows.length === 0) {
        msg += `予定されたテレアポはありません`
      }

      return { message: msg, data: rows }
    }

    default:
      return { message: `⚠️ CRMアクション「${action}」は未対応です`, data: null }
  }
}
