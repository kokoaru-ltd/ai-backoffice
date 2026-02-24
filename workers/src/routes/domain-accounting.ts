import { neon } from '@neondatabase/serverless'
import type { Env } from '../lib/db'

type Sql = ReturnType<typeof neon>

function yen(n: number) { return `¥${n.toLocaleString()}` }

export async function handleAccounting(sql: Sql, env: Env, orgId: string, userId: string, action: string, params: Record<string, any>) {
  switch (action) {
    case 'get_revenue': {
      const period = params.period || new Date().toISOString().slice(0, 7)
      const rows = await sql`
        SELECT COALESCE(SUM(amount), 0) as total, COUNT(*) as count
        FROM invoices
        WHERE org_id = ${orgId}::uuid AND type = 'receivable' AND status = 'paid'
          AND to_char(created_at, 'YYYY-MM') = ${period}
      `
      const byContact = await sql`
        SELECT c.company_name, SUM(i.amount) as total, COUNT(*) as count
        FROM invoices i LEFT JOIN contacts c ON i.contact_id = c.id
        WHERE i.org_id = ${orgId}::uuid AND i.type = 'receivable' AND i.status = 'paid'
          AND to_char(i.created_at, 'YYYY-MM') = ${period}
        GROUP BY c.company_name ORDER BY total DESC LIMIT 5
      `
      let msg = `📊 ${period} 売上レポート\n━━━━━━━━━━━━━\n合計: ${yen(Number(rows[0].total))} (${rows[0].count}件)\n`
      if (byContact.length > 0) {
        msg += '\n【取引先別】\n'
        byContact.forEach((r: any, i: number) => {
          msg += `${i + 1}. ${r.company_name || '未設定'}: ${yen(Number(r.total))} (${r.count}件)\n`
        })
      }
      return { message: msg, data: rows[0] }
    }

    case 'get_expenses': {
      const rows = await sql`
        SELECT id, category, amount, description, status, created_at
        FROM expenses
        WHERE org_id = ${orgId}::uuid
        ORDER BY created_at DESC LIMIT 20
      `
      const total = rows.reduce((sum: number, r: any) => sum + Number(r.amount), 0)
      const pending = rows.filter((r: any) => r.status === 'pending')
      const approved = rows.filter((r: any) => r.status === 'approved')

      let msg = `💰 経費一覧\n━━━━━━━━━━━━━\n合計: ${yen(total)} (${rows.length}件)\n承認済: ${approved.length}件 / 未承認: ${pending.length}件\n`

      if (pending.length > 0) {
        msg += '\n🔸 承認待ち:\n'
        pending.forEach((r: any) => {
          msg += `  • ${r.category} ${yen(Number(r.amount))} - ${r.description}\n`
        })
      }

      msg += '\n📋 直近の経費:\n'
      rows.slice(0, 8).forEach((r: any) => {
        const status = r.status === 'approved' ? '✅' : r.status === 'pending' ? '⏳' : '❌'
        msg += `${status} ${r.category} ${yen(Number(r.amount))} - ${r.description}\n`
      })

      return { message: msg, data: rows }
    }

    case 'create_expense': {
      const { category, amount, description } = params
      if (!category || !amount) return { message: '⚠️ カテゴリと金額は必須です\n\n例: 「交通費1200円 新宿→渋谷」', data: null }

      const autoApprove = Number(amount) < 5000
      const status = autoApprove ? 'approved' : 'pending'

      const rows = await sql`
        INSERT INTO expenses (org_id, user_id, category, amount, description, status)
        VALUES (${orgId}::uuid, ${userId}::uuid, ${category}, ${Number(amount)}, ${description || ''}, ${status}::expense_status)
        RETURNING id, status
      `
      let msg = autoApprove
        ? `✅ 経費を自動承認しました\n━━━━━━━━━━━━━\nカテゴリ: ${category}\n金額: ${yen(Number(amount))}\n内容: ${description || '-'}\n\n※ ${yen(5000)}未満のため自動承認`
        : `⏳ 経費を申請しました（承認待ち）\n━━━━━━━━━━━━━\nカテゴリ: ${category}\n金額: ${yen(Number(amount))}\n内容: ${description || '-'}\n\n管理者の承認をお待ちください`
      return { message: msg, data: rows[0] }
    }

    case 'create_invoice': {
      const { amount, due_date } = params
      if (!amount) return { message: '⚠️ 金額は必須です', data: null }

      const rows = await sql`
        INSERT INTO invoices (org_id, type, amount, status, due_date)
        VALUES (${orgId}::uuid, 'receivable', ${Number(amount)}, 'draft', ${due_date || null})
        RETURNING id
      `
      return { message: `📄 請求書を作成しました\n━━━━━━━━━━━━━\n金額: ${yen(Number(amount))}\n期日: ${due_date || '未設定'}\nステータス: 下書き`, data: rows[0] }
    }

    case 'get_pl': {
      const period = params.period || new Date().toISOString().slice(0, 7)
      const revenue = await sql`
        SELECT COALESCE(SUM(amount), 0) as total FROM invoices
        WHERE org_id = ${orgId}::uuid AND type = 'receivable' AND status = 'paid'
          AND to_char(created_at, 'YYYY-MM') = ${period}
      `
      const expenseRows = await sql`
        SELECT category, SUM(amount) as total
        FROM expenses
        WHERE org_id = ${orgId}::uuid AND status = 'approved'
          AND to_char(created_at, 'YYYY-MM') = ${period}
        GROUP BY category ORDER BY total DESC
      `
      const rev = Number(revenue[0].total)
      const exp = expenseRows.reduce((sum: number, r: any) => sum + Number(r.total), 0)
      const profit = rev - exp
      const margin = rev > 0 ? ((profit / rev) * 100).toFixed(1) : '0'

      let msg = `📊 ${period} 損益計算書\n━━━━━━━━━━━━━\n`
      msg += `売上高:     ${yen(rev)}\n`
      msg += `経費合計:   ${yen(exp)}\n`
      msg += `━━━━━━━━━━━━━\n`
      msg += `営業利益:   ${yen(profit)} (利益率 ${margin}%)\n`

      if (expenseRows.length > 0) {
        msg += '\n【経費内訳】\n'
        expenseRows.forEach((r: any) => {
          const pct = exp > 0 ? ((Number(r.total) / exp) * 100).toFixed(0) : '0'
          msg += `  ${r.category}: ${yen(Number(r.total))} (${pct}%)\n`
        })
      }

      return { message: msg, data: { revenue: rev, expenses: exp, profit } }
    }

    case 'approve_expense': {
      const { expense_id } = params
      if (!expense_id) return { message: '⚠️ 経費IDが必要です', data: null }

      const before = await sql`
        SELECT category, amount, description FROM expenses
        WHERE id = ${expense_id}::uuid AND org_id = ${orgId}::uuid
      `
      await sql`
        UPDATE expenses SET status = 'approved', approved_by = ${userId}::uuid
        WHERE id = ${expense_id}::uuid AND org_id = ${orgId}::uuid
      `
      const e = before[0]
      return { message: `✅ 経費を承認しました\n━━━━━━━━━━━━━\nカテゴリ: ${e?.category}\n金額: ${yen(Number(e?.amount))}\n内容: ${e?.description}`, data: { expense_id } }
    }

    default:
      return { message: `⚠️ 会計アクション「${action}」は未対応です`, data: null }
  }
}
