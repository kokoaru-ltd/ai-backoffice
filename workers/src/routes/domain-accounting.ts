import { neon } from '@neondatabase/serverless'
import type { Env } from '../lib/db'

type Sql = ReturnType<typeof neon>

export async function handleAccounting(sql: Sql, env: Env, orgId: string, userId: string, action: string, params: Record<string, any>) {
  switch (action) {
    case 'get_revenue': {
      const period = params.period || new Date().toISOString().slice(0, 7) // YYYY-MM
      const rows = await sql`
        SELECT COALESCE(SUM(amount), 0) as total, COUNT(*) as count
        FROM invoices
        WHERE org_id = ${orgId}::uuid AND type = 'receivable' AND status = 'paid'
          AND to_char(created_at, 'YYYY-MM') = ${period}
      `
      return { message: `${period}の売上: ¥${Number(rows[0].total).toLocaleString()} (${rows[0].count}件)`, data: rows[0] }
    }

    case 'get_expenses': {
      const rows = await sql`
        SELECT id, category, amount, description, status, created_at
        FROM expenses
        WHERE org_id = ${orgId}::uuid
        ORDER BY created_at DESC LIMIT 20
      `
      const total = rows.reduce((sum: number, r: any) => sum + Number(r.amount), 0)
      return { message: `経費一覧: ${rows.length}件 (合計 ¥${total.toLocaleString()})`, data: rows }
    }

    case 'create_expense': {
      const { category, amount, description } = params
      if (!category || !amount) return { message: 'カテゴリと金額は必須です', data: null }

      const autoApprove = Number(amount) < 5000
      const status = autoApprove ? 'approved' : 'pending'

      const rows = await sql`
        INSERT INTO expenses (org_id, user_id, category, amount, description, status)
        VALUES (${orgId}::uuid, ${userId}::uuid, ${category}, ${Number(amount)}, ${description || ''}, ${status}::expense_status)
        RETURNING id, status
      `
      const msg = autoApprove
        ? `経費 ¥${Number(amount).toLocaleString()} を自動承認しました`
        : `経費 ¥${Number(amount).toLocaleString()} を申請しました（承認待ち）`
      return { message: msg, data: rows[0] }
    }

    case 'create_invoice': {
      const { amount, due_date } = params
      if (!amount) return { message: '金額は必須です', data: null }

      const rows = await sql`
        INSERT INTO invoices (org_id, type, amount, status, due_date)
        VALUES (${orgId}::uuid, 'receivable', ${Number(amount)}, 'draft', ${due_date || null})
        RETURNING id
      `
      return { message: `請求書を作成しました (¥${Number(amount).toLocaleString()})`, data: rows[0] }
    }

    case 'get_pl': {
      const period = params.period || new Date().toISOString().slice(0, 7)
      const revenue = await sql`
        SELECT COALESCE(SUM(amount), 0) as total FROM invoices
        WHERE org_id = ${orgId}::uuid AND type = 'receivable' AND status = 'paid'
          AND to_char(created_at, 'YYYY-MM') = ${period}
      `
      const expense = await sql`
        SELECT COALESCE(SUM(amount), 0) as total FROM expenses
        WHERE org_id = ${orgId}::uuid AND status = 'approved'
          AND to_char(created_at, 'YYYY-MM') = ${period}
      `
      const rev = Number(revenue[0].total)
      const exp = Number(expense[0].total)
      const profit = rev - exp
      return {
        message: `${period}損益: 売上 ¥${rev.toLocaleString()} - 経費 ¥${exp.toLocaleString()} = 利益 ¥${profit.toLocaleString()}`,
        data: { revenue: rev, expenses: exp, profit }
      }
    }

    case 'approve_expense': {
      const { expense_id } = params
      if (!expense_id) return { message: '経費IDが必要です', data: null }
      await sql`
        UPDATE expenses SET status = 'approved', approved_by = ${userId}::uuid
        WHERE id = ${expense_id}::uuid AND org_id = ${orgId}::uuid
      `
      return { message: '経費を承認しました', data: { expense_id } }
    }

    default:
      return { message: `会計アクション「${action}」は未対応です`, data: null }
  }
}
