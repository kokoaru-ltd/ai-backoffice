import { neon } from '@neondatabase/serverless'
import type { Env } from '../lib/db'

type Sql = ReturnType<typeof neon>

function yen(n: number) { return `¥${n.toLocaleString()}` }

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Tokyo' })
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric', weekday: 'short', timeZone: 'Asia/Tokyo' })
}

function fmtMinutes(m: number) {
  const h = Math.floor(m / 60)
  const min = m % 60
  return h > 0 ? `${h}時間${min}分` : `${min}分`
}

export async function handleHR(sql: Sql, env: Env, orgId: string, userId: string, action: string, params: Record<string, any>) {
  const getEmployee = async () => {
    const rows = await sql`
      SELECT e.id, e.employee_number, e.department, e.position, e.paid_leave_total, e.paid_leave_used,
             u.full_name
      FROM employees e
      LEFT JOIN user_profiles u ON e.user_id = u.id
      WHERE e.org_id = ${orgId}::uuid AND e.user_id = ${userId}::uuid LIMIT 1
    `
    return rows[0] || null
  }

  switch (action) {
    case 'clock_in': {
      const emp = await getEmployee()
      if (!emp) return { message: '⚠️ 従業員レコードが見つかりません\n管理者に連絡してください', data: null }

      const today = new Date().toISOString().slice(0, 10)
      const existing = await sql`
        SELECT id FROM attendance
        WHERE employee_id = ${emp.id}::uuid AND date = ${today}::date
      `
      if (existing.length > 0) {
        return { message: `⚠️ 本日はすでに出勤打刻済みです\n━━━━━━━━━━━━━\n日付: ${today}\n社員: ${emp.full_name || emp.employee_number}`, data: null }
      }

      const now = new Date().toISOString()
      const rows = await sql`
        INSERT INTO attendance (org_id, employee_id, date, clock_in, type)
        VALUES (${orgId}::uuid, ${emp.id}::uuid, ${today}::date, ${now}::timestamptz, 'normal')
        RETURNING id, clock_in
      `

      // Get this month's attendance stats
      const month = today.slice(0, 7)
      const monthStats = await sql`
        SELECT COUNT(*) as days, COALESCE(SUM(overtime_minutes), 0) as overtime
        FROM attendance
        WHERE employee_id = ${emp.id}::uuid AND to_char(date, 'YYYY-MM') = ${month} AND type = 'normal'
      `

      let msg = `🟢 出勤打刻完了\n━━━━━━━━━━━━━\n`
      msg += `社員: ${emp.full_name || emp.employee_number}\n`
      msg += `部署: ${emp.department || '-'}\n`
      msg += `時刻: ${fmtTime(rows[0].clock_in)}\n`
      msg += `日付: ${today}\n`
      msg += `\n📊 今月の勤務状況\n`
      msg += `出勤日数: ${Number(monthStats[0].days) + 1}日\n`
      const otHours = Math.floor(Number(monthStats[0].overtime) / 60)
      if (otHours > 0) msg += `残業累計: ${fmtMinutes(Number(monthStats[0].overtime))}\n`
      return { message: msg, data: rows[0] }
    }

    case 'clock_out': {
      const emp = await getEmployee()
      if (!emp) return { message: '⚠️ 従業員レコードが見つかりません', data: null }

      const today = new Date().toISOString().slice(0, 10)
      const existing = await sql`
        SELECT id, clock_in FROM attendance
        WHERE employee_id = ${emp.id}::uuid AND date = ${today}::date AND clock_out IS NULL
      `
      if (existing.length === 0) {
        return { message: '⚠️ 出勤打刻がないか、すでに退勤済みです', data: null }
      }

      const now = new Date()
      const clockIn = new Date(existing[0].clock_in)
      const workedMinutes = Math.floor((now.getTime() - clockIn.getTime()) / 60000)
      const breakMinutes = workedMinutes > 360 ? 60 : 0
      const actualMinutes = workedMinutes - breakMinutes
      const overtimeMinutes = Math.max(0, actualMinutes - 480)

      await sql`
        UPDATE attendance
        SET clock_out = ${now.toISOString()}::timestamptz,
            break_minutes = ${breakMinutes},
            overtime_minutes = ${overtimeMinutes}
        WHERE id = ${existing[0].id}::uuid
      `

      let msg = `🔴 退勤打刻完了\n━━━━━━━━━━━━━\n`
      msg += `社員: ${emp.full_name || emp.employee_number}\n`
      msg += `出勤: ${fmtTime(existing[0].clock_in)}\n`
      msg += `退勤: ${fmtTime(now.toISOString())}\n`
      msg += `\n⏱ 勤務時間内訳\n`
      msg += `総拘束: ${fmtMinutes(workedMinutes)}\n`
      if (breakMinutes > 0) msg += `休憩:   ${fmtMinutes(breakMinutes)}\n`
      msg += `実働:   ${fmtMinutes(actualMinutes)}\n`
      if (overtimeMinutes > 0) {
        msg += `\n⚠️ 残業: ${fmtMinutes(overtimeMinutes)}\n`
        // Check monthly overtime
        const month = today.slice(0, 7)
        const monthOT = await sql`
          SELECT COALESCE(SUM(overtime_minutes), 0) as total
          FROM attendance
          WHERE employee_id = ${emp.id}::uuid AND to_char(date, 'YYYY-MM') = ${month}
        `
        const monthTotal = Number(monthOT[0].total) + overtimeMinutes
        const monthHours = Math.floor(monthTotal / 60)
        msg += `今月累計残業: ${fmtMinutes(monthTotal)}\n`
        if (monthHours >= 45) msg += `🚨 36協定上限（45時間）超過！`
        else if (monthHours >= 36) msg += `⚠️ 36協定上限に近づいています（${monthHours}/45時間）`
      }
      return { message: msg, data: { worked_minutes: actualMinutes, overtime_minutes: overtimeMinutes } }
    }

    case 'get_attendance': {
      const emp = await getEmployee()
      if (!emp) return { message: '⚠️ 従業員レコードが見つかりません', data: null }

      const rows = await sql`
        SELECT date, clock_in, clock_out, break_minutes, overtime_minutes, type
        FROM attendance
        WHERE employee_id = ${emp.id}::uuid
        ORDER BY date DESC LIMIT 14
      `

      const totalDays = rows.filter((r: any) => r.type === 'normal').length
      const leaveDays = rows.filter((r: any) => r.type === 'paid_leave').length
      const totalOT = rows.reduce((sum: number, r: any) => sum + Number(r.overtime_minutes || 0), 0)
      const totalWorked = rows.reduce((sum: number, r: any) => {
        if (!r.clock_in || !r.clock_out) return sum
        const diff = Math.floor((new Date(r.clock_out).getTime() - new Date(r.clock_in).getTime()) / 60000)
        return sum + diff - Number(r.break_minutes || 0)
      }, 0)

      let msg = `📋 勤怠記録（直近${rows.length}件）\n━━━━━━━━━━━━━\n`
      msg += `社員: ${emp.full_name || emp.employee_number}\n`
      msg += `出勤: ${totalDays}日 / 有給: ${leaveDays}日\n`
      if (totalWorked > 0) msg += `実働合計: ${fmtMinutes(totalWorked)}\n`
      if (totalOT > 0) msg += `残業合計: ${fmtMinutes(totalOT)}\n`

      msg += `\n【明細】\n`
      rows.forEach((r: any) => {
        const typeIcon = r.type === 'paid_leave' ? '🏖' : r.type === 'absent' ? '❌' : '📅'
        if (r.type === 'paid_leave') {
          msg += `${typeIcon} ${fmtDate(r.date)} 有給休暇\n`
        } else if (r.clock_in) {
          const inTime = fmtTime(r.clock_in)
          const outTime = r.clock_out ? fmtTime(r.clock_out) : '勤務中'
          const ot = Number(r.overtime_minutes || 0) > 0 ? ` +${fmtMinutes(Number(r.overtime_minutes))}` : ''
          msg += `${typeIcon} ${fmtDate(r.date)} ${inTime}→${outTime}${ot}\n`
        }
      })

      return { message: msg, data: rows }
    }

    case 'request_leave': {
      const emp = await getEmployee()
      if (!emp) return { message: '⚠️ 従業員レコードが見つかりません', data: null }

      const { date } = params
      if (!date) return { message: '⚠️ 日付を指定してください\n\n例: 「3月15日に有給取りたい」', data: null }

      const remaining = emp.paid_leave_total - emp.paid_leave_used
      if (remaining <= 0) {
        return { message: `⚠️ 有給休暇の残日数がありません\n━━━━━━━━━━━━━\n付与: ${emp.paid_leave_total}日\n消化: ${emp.paid_leave_used}日\n残り: 0日`, data: null }
      }

      await sql`
        INSERT INTO attendance (org_id, employee_id, date, type)
        VALUES (${orgId}::uuid, ${emp.id}::uuid, ${date}::date, 'paid_leave')
        ON CONFLICT (employee_id, date) DO NOTHING
      `
      await sql`
        UPDATE employees SET paid_leave_used = paid_leave_used + 1
        WHERE id = ${emp.id}::uuid
      `

      const newRemaining = remaining - 1
      let msg = `🏖 有給休暇を申請しました\n━━━━━━━━━━━━━\n`
      msg += `社員: ${emp.full_name || emp.employee_number}\n`
      msg += `日付: ${date}\n`
      msg += `\n📊 有給残高\n`
      msg += `付与: ${emp.paid_leave_total}日\n`
      msg += `消化: ${emp.paid_leave_used + 1}日\n`
      msg += `残り: ${newRemaining}日\n`
      const bar = '█'.repeat(Math.round((emp.paid_leave_used + 1) / emp.paid_leave_total * 10)) +
                  '░'.repeat(Math.round(newRemaining / emp.paid_leave_total * 10))
      msg += `[${bar}] ${Math.round(((emp.paid_leave_used + 1) / emp.paid_leave_total) * 100)}%消化`
      return { message: msg, data: { date, remaining: newRemaining } }
    }

    case 'get_leave_balance': {
      const emp = await getEmployee()
      if (!emp) return { message: '⚠️ 従業員レコードが見つかりません', data: null }

      const remaining = emp.paid_leave_total - emp.paid_leave_used
      const usedPct = Math.round((emp.paid_leave_used / emp.paid_leave_total) * 100)
      const bar = '█'.repeat(Math.round(emp.paid_leave_used / emp.paid_leave_total * 10)) +
                  '░'.repeat(Math.round(remaining / emp.paid_leave_total * 10))

      // Get upcoming leaves
      const upcoming = await sql`
        SELECT date FROM attendance
        WHERE employee_id = ${emp.id}::uuid AND type = 'paid_leave' AND date >= CURRENT_DATE
        ORDER BY date LIMIT 5
      `

      let msg = `🏖 有給休暇残高\n━━━━━━━━━━━━━\n`
      msg += `社員: ${emp.full_name || emp.employee_number}\n\n`
      msg += `残り: ${remaining}日 / ${emp.paid_leave_total}日\n`
      msg += `消化: ${emp.paid_leave_used}日 (${usedPct}%)\n`
      msg += `[${bar}]\n`

      if (upcoming.length > 0) {
        msg += `\n📅 取得予定\n`
        upcoming.forEach((r: any) => {
          msg += `  • ${fmtDate(r.date)}\n`
        })
      }

      return { message: msg, data: { total: emp.paid_leave_total, used: emp.paid_leave_used, remaining } }
    }

    case 'get_overtime': {
      const emp = await getEmployee()
      if (!emp) return { message: '⚠️ 従業員レコードが見つかりません', data: null }

      const period = params.period || new Date().toISOString().slice(0, 7)
      const rows = await sql`
        SELECT date, overtime_minutes
        FROM attendance
        WHERE employee_id = ${emp.id}::uuid
          AND to_char(date, 'YYYY-MM') = ${period}
          AND overtime_minutes > 0
        ORDER BY date DESC
      `
      const totalMinutes = rows.reduce((sum: number, r: any) => sum + Number(r.overtime_minutes), 0)
      const hours = Math.floor(totalMinutes / 60)
      const avgPerDay = rows.length > 0 ? Math.round(totalMinutes / rows.length) : 0

      let msg = `⏰ ${period} 残業レポート\n━━━━━━━━━━━━━\n`
      msg += `社員: ${emp.full_name || emp.employee_number}\n\n`
      msg += `合計: ${fmtMinutes(totalMinutes)}\n`
      msg += `残業日数: ${rows.length}日\n`
      if (rows.length > 0) msg += `平均/日: ${fmtMinutes(avgPerDay)}\n`

      // 36 agreement gauge
      msg += `\n📊 36協定ゲージ (上限45時間)\n`
      const gauge = Math.min(Math.round(hours / 45 * 20), 20)
      const gaugeBar = '█'.repeat(gauge) + '░'.repeat(20 - gauge)
      msg += `[${gaugeBar}] ${hours}/45h\n`
      if (hours >= 45) msg += `🚨 上限超過！ 即時対応が必要です\n`
      else if (hours >= 36) msg += `⚠️ 注意！上限に近づいています\n`
      else if (hours >= 20) msg += `📈 やや多め。ペース管理を推奨\n`
      else msg += `✅ 適正範囲内\n`

      if (rows.length > 0) {
        msg += `\n【日別残業】\n`
        rows.slice(0, 10).forEach((r: any) => {
          msg += `  ${fmtDate(r.date)}: ${fmtMinutes(Number(r.overtime_minutes))}\n`
        })
      }

      return { message: msg, data: { period, total_minutes: totalMinutes, hours } }
    }

    case 'get_payroll': {
      const emp = await getEmployee()
      if (!emp) return { message: '⚠️ 従業員レコードが見つかりません', data: null }

      const period = params.period || new Date().toISOString().slice(0, 7)
      const rows = await sql`
        SELECT * FROM payroll
        WHERE employee_id = ${emp.id}::uuid AND period = ${period}
      `
      if (rows.length === 0) return { message: `⚠️ ${period}の給与明細はまだ作成されていません`, data: null }

      const p = rows[0]
      const base = Number(p.base_salary)
      const ot = Number(p.overtime_pay)
      const deductions = Number(p.deductions || 0)
      const net = Number(p.net_pay)
      const gross = base + ot

      let msg = `💰 ${period} 給与明細\n━━━━━━━━━━━━━\n`
      msg += `社員: ${emp.full_name || emp.employee_number}\n`
      msg += `部署: ${emp.department || '-'}\n\n`
      msg += `【支給】\n`
      msg += `  基本給:     ${yen(base)}\n`
      if (ot > 0) msg += `  残業手当:   ${yen(ot)}\n`
      msg += `  ─────────\n`
      msg += `  総支給額:   ${yen(gross)}\n\n`
      if (deductions > 0) {
        msg += `【控除】\n`
        msg += `  各種控除:   ${yen(deductions)}\n\n`
      }
      msg += `━━━━━━━━━━━━━\n`
      msg += `💵 手取り額:  ${yen(net)}`

      return { message: msg, data: p }
    }

    default:
      return { message: `⚠️ 人事アクション「${action}」は未対応です`, data: null }
  }
}
