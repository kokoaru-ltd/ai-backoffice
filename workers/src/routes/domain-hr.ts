import { neon } from '@neondatabase/serverless'
import type { Env } from '../lib/db'

type Sql = ReturnType<typeof neon>

export async function handleHR(sql: Sql, env: Env, orgId: string, userId: string, action: string, params: Record<string, any>) {
  // Get employee record for this user
  const getEmployee = async () => {
    const rows = await sql`
      SELECT id, employee_number, department, position, paid_leave_total, paid_leave_used
      FROM employees WHERE org_id = ${orgId}::uuid AND user_id = ${userId}::uuid LIMIT 1
    `
    return rows[0] || null
  }

  switch (action) {
    case 'clock_in': {
      const emp = await getEmployee()
      if (!emp) return { message: '従業員レコードが見つかりません', data: null }

      const today = new Date().toISOString().slice(0, 10)
      const existing = await sql`
        SELECT id FROM attendance
        WHERE employee_id = ${emp.id}::uuid AND date = ${today}::date
      `
      if (existing.length > 0) {
        return { message: '本日はすでに出勤打刻済みです', data: null }
      }

      const now = new Date().toISOString()
      const rows = await sql`
        INSERT INTO attendance (org_id, employee_id, date, clock_in, type)
        VALUES (${orgId}::uuid, ${emp.id}::uuid, ${today}::date, ${now}::timestamptz, 'normal')
        RETURNING id, clock_in
      `
      return { message: `出勤打刻しました (${new Date(rows[0].clock_in).toLocaleTimeString('ja-JP')})`, data: rows[0] }
    }

    case 'clock_out': {
      const emp = await getEmployee()
      if (!emp) return { message: '従業員レコードが見つかりません', data: null }

      const today = new Date().toISOString().slice(0, 10)
      const existing = await sql`
        SELECT id, clock_in FROM attendance
        WHERE employee_id = ${emp.id}::uuid AND date = ${today}::date AND clock_out IS NULL
      `
      if (existing.length === 0) {
        return { message: '出勤打刻がないか、すでに退勤済みです', data: null }
      }

      const now = new Date()
      const clockIn = new Date(existing[0].clock_in)
      const workedMinutes = Math.floor((now.getTime() - clockIn.getTime()) / 60000)
      const breakMinutes = workedMinutes > 360 ? 60 : 0 // 6h以上で休憩60分
      const actualMinutes = workedMinutes - breakMinutes
      const overtimeMinutes = Math.max(0, actualMinutes - 480) // 8h超で残業

      await sql`
        UPDATE attendance
        SET clock_out = ${now.toISOString()}::timestamptz,
            break_minutes = ${breakMinutes},
            overtime_minutes = ${overtimeMinutes}
        WHERE id = ${existing[0].id}::uuid
      `

      const hours = Math.floor(actualMinutes / 60)
      const mins = actualMinutes % 60
      let msg = `退勤打刻しました (実働 ${hours}時間${mins}分)`
      if (overtimeMinutes > 0) msg += ` ※残業 ${Math.floor(overtimeMinutes / 60)}時間${overtimeMinutes % 60}分`
      return { message: msg, data: { worked_minutes: actualMinutes, overtime_minutes: overtimeMinutes } }
    }

    case 'get_attendance': {
      const emp = await getEmployee()
      if (!emp) return { message: '従業員レコードが見つかりません', data: null }

      const rows = await sql`
        SELECT date, clock_in, clock_out, break_minutes, overtime_minutes, type
        FROM attendance
        WHERE employee_id = ${emp.id}::uuid
        ORDER BY date DESC LIMIT 30
      `
      return { message: `勤怠記録: 直近${rows.length}件`, data: rows }
    }

    case 'request_leave': {
      const emp = await getEmployee()
      if (!emp) return { message: '従業員レコードが見つかりません', data: null }

      const { date } = params
      if (!date) return { message: '日付を指定してください', data: null }

      const remaining = emp.paid_leave_total - emp.paid_leave_used
      if (remaining <= 0) return { message: '有給休暇の残日数がありません', data: null }

      await sql`
        INSERT INTO attendance (org_id, employee_id, date, type)
        VALUES (${orgId}::uuid, ${emp.id}::uuid, ${date}::date, 'paid_leave')
        ON CONFLICT (employee_id, date) DO NOTHING
      `
      await sql`
        UPDATE employees SET paid_leave_used = paid_leave_used + 1
        WHERE id = ${emp.id}::uuid
      `
      return { message: `${date} の有給申請を登録しました (残り ${remaining - 1}日)`, data: { date, remaining: remaining - 1 } }
    }

    case 'get_leave_balance': {
      const emp = await getEmployee()
      if (!emp) return { message: '従業員レコードが見つかりません', data: null }
      const remaining = emp.paid_leave_total - emp.paid_leave_used
      return { message: `有給残日数: ${remaining}日 (${emp.paid_leave_used}日消化 / ${emp.paid_leave_total}日付与)`, data: { total: emp.paid_leave_total, used: emp.paid_leave_used, remaining } }
    }

    case 'get_overtime': {
      const emp = await getEmployee()
      if (!emp) return { message: '従業員レコードが見つかりません', data: null }

      const period = params.period || new Date().toISOString().slice(0, 7)
      const rows = await sql`
        SELECT COALESCE(SUM(overtime_minutes), 0) as total_minutes
        FROM attendance
        WHERE employee_id = ${emp.id}::uuid
          AND to_char(date, 'YYYY-MM') = ${period}
      `
      const totalMinutes = Number(rows[0].total_minutes)
      const hours = Math.floor(totalMinutes / 60)
      let msg = `${period}の残業: ${hours}時間${totalMinutes % 60}分`
      if (hours >= 45) msg += ' ⚠️ 36協定上限（45時間）に達しています！'
      else if (hours >= 36) msg += ' ⚠️ 36協定上限に近づいています'
      return { message: msg, data: { period, total_minutes: totalMinutes, hours } }
    }

    case 'get_payroll': {
      const emp = await getEmployee()
      if (!emp) return { message: '従業員レコードが見つかりません', data: null }

      const period = params.period || new Date().toISOString().slice(0, 7)
      const rows = await sql`
        SELECT * FROM payroll
        WHERE employee_id = ${emp.id}::uuid AND period = ${period}
      `
      if (rows.length === 0) return { message: `${period}の給与明細はまだ作成されていません`, data: null }
      const p = rows[0]
      return {
        message: `${period}給与明細: 基本給 ¥${Number(p.base_salary).toLocaleString()} + 残業手当 ¥${Number(p.overtime_pay).toLocaleString()} = 手取り ¥${Number(p.net_pay).toLocaleString()}`,
        data: p
      }
    }

    default:
      return { message: `人事アクション「${action}」は未対応です`, data: null }
  }
}
