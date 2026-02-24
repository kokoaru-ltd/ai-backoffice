import { neon } from '@neondatabase/serverless'
import type { Env } from '../lib/db'

type Sql = ReturnType<typeof neon>

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
      return { message: `顧客一覧: ${rows.length}件`, data: rows }
    }

    case 'create_contact': {
      const { company_name, contact_name, email, phone } = params
      if (!contact_name) return { message: '担当者名は必須です', data: null }

      const rows = await sql`
        INSERT INTO contacts (org_id, company_name, contact_name, email, phone)
        VALUES (${orgId}::uuid, ${company_name || null}, ${contact_name}, ${email || null}, ${phone || null})
        RETURNING id, contact_name
      `
      return { message: `顧客「${contact_name}」を登録しました`, data: rows[0] }
    }

    case 'get_deals': {
      const stage = params.stage || null
      const rows = stage
        ? await sql`
            SELECT d.id, d.title, d.amount, d.stage, d.expected_close_date, c.contact_name
            FROM deals d LEFT JOIN contacts c ON d.contact_id = c.id
            WHERE d.org_id = ${orgId}::uuid AND d.stage = ${stage}::deal_stage
            ORDER BY d.created_at DESC LIMIT 20
          `
        : await sql`
            SELECT d.id, d.title, d.amount, d.stage, d.expected_close_date, c.contact_name
            FROM deals d LEFT JOIN contacts c ON d.contact_id = c.id
            WHERE d.org_id = ${orgId}::uuid
            ORDER BY d.created_at DESC LIMIT 20
          `
      const totalAmount = rows.reduce((sum: number, r: any) => sum + Number(r.amount), 0)
      return { message: `商談一覧: ${rows.length}件 (合計 ¥${totalAmount.toLocaleString()})`, data: rows }
    }

    case 'create_deal': {
      const { title, contact_id, amount } = params
      if (!title) return { message: '商談名は必須です', data: null }

      const rows = await sql`
        INSERT INTO deals (org_id, contact_id, title, amount, assigned_to)
        VALUES (${orgId}::uuid, ${contact_id || null}, ${title}, ${Number(amount) || 0}, ${userId}::uuid)
        RETURNING id, title, stage
      `
      return { message: `商談「${title}」を作成しました`, data: rows[0] }
    }

    case 'update_deal_stage': {
      const { deal_id, stage } = params
      if (!deal_id || !stage) return { message: '商談IDとステージは必須です', data: null }

      await sql`
        UPDATE deals SET stage = ${stage}::deal_stage
        WHERE id = ${deal_id}::uuid AND org_id = ${orgId}::uuid
      `
      const stageLabels: Record<string, string> = {
        lead: 'リード', proposal: '提案', negotiation: '交渉中',
        closed_won: '受注', closed_lost: '失注'
      }
      return { message: `商談ステージを「${stageLabels[stage] || stage}」に更新しました`, data: { deal_id, stage } }
    }

    case 'log_interaction': {
      const { contact_id, type, summary } = params
      if (!contact_id || !type || !summary) return { message: '顧客ID、種別、概要は必須です', data: null }

      const rows = await sql`
        INSERT INTO interactions (org_id, contact_id, type, summary, created_by)
        VALUES (${orgId}::uuid, ${contact_id}::uuid, ${type}::interaction_type, ${summary}, ${userId}::uuid)
        RETURNING id
      `
      return { message: `対応記録を追加しました`, data: rows[0] }
    }

    case 'get_sales_report': {
      const period = params.period || new Date().toISOString().slice(0, 7)
      const won = await sql`
        SELECT COALESCE(SUM(amount), 0) as total, COUNT(*) as count
        FROM deals WHERE org_id = ${orgId}::uuid AND stage = 'closed_won'
          AND to_char(created_at, 'YYYY-MM') = ${period}
      `
      const pipeline = await sql`
        SELECT stage, COUNT(*) as count, COALESCE(SUM(amount), 0) as total
        FROM deals WHERE org_id = ${orgId}::uuid AND stage NOT IN ('closed_won', 'closed_lost')
        GROUP BY stage
      `
      return {
        message: `${period}売上レポート: 受注 ¥${Number(won[0].total).toLocaleString()} (${won[0].count}件)`,
        data: { won: won[0], pipeline }
      }
    }

    case 'get_teleapo_schedule': {
      const rows = await sql`
        SELECT tc.id, tc.status, tc.scheduled_at, c.contact_name, c.company_name, c.phone
        FROM teleapo_calls tc
        JOIN contacts c ON tc.contact_id = c.id
        WHERE tc.org_id = ${orgId}::uuid AND tc.status IN ('scheduled', 'callback')
        ORDER BY tc.scheduled_at ASC LIMIT 20
      `
      return { message: `テレアポ予定: ${rows.length}件`, data: rows }
    }

    default:
      return { message: `CRMアクション「${action}」は未対応です`, data: null }
  }
}
