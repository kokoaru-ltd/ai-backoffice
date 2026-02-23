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

function formatYen(amount: number): string {
  return `\u00a5${amount.toLocaleString("ja-JP")}`;
}

function formatDateJP(date: string | Date): string {
  const d = new Date(date);
  return `${d.getFullYear()}\u5e74${d.getMonth() + 1}\u6708${d.getDate()}\u65e5`;
}

function formatHours(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}時間${m}分` : `${h}時間`;
}

/** Parse "YYYY-MM" period into start/end dates */
function parsePeriod(period: string): { start: string; end: string } {
  const [year, month] = period.split("-").map(Number);
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const endDate = new Date(year, month, 0);
  const end = `${year}-${String(month).padStart(2, "0")}-${String(endDate.getDate()).padStart(2, "0")}`;
  return { start, end };
}

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// =============================================================================
// Constants
// =============================================================================

/** 36 agreement limit: 45 hours per month */
const OVERTIME_MONTHLY_LIMIT_MINUTES = 45 * 60;

/** Standard working hours per day (8 hours) */
const STANDARD_WORK_MINUTES = 8 * 60;

/** Break required if work exceeds 6 hours (60 minutes break) */
const BREAK_THRESHOLD_MINUTES = 6 * 60;
const MANDATORY_BREAK_MINUTES = 60;

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
// Action handlers
// =============================================================================

async function clockIn(
  db: SupabaseClient,
  params: Record<string, any>,
): Promise<DomainResponse> {
  const { org_id, employee_id } = params;
  if (!org_id || !employee_id) {
    return { success: false, message: "org_id と employee_id は必須です" };
  }

  const today = todayStr();
  const now = new Date().toISOString();

  // Check for duplicate clock-in today
  const { data: existing } = await db
    .from("attendance")
    .select("id, clock_in")
    .eq("employee_id", employee_id)
    .eq("date", today)
    .maybeSingle();

  if (existing?.clock_in) {
    return {
      success: false,
      message: `本日は既に出勤打刻済みです（${formatDateJP(today)}）`,
      data: { attendance_id: existing.id, clock_in: existing.clock_in },
    };
  }

  if (existing) {
    // Record exists (e.g., pre-created for leave) but no clock_in yet
    const { data: updated, error } = await db
      .from("attendance")
      .update({ clock_in: now, type: "normal" })
      .eq("id", existing.id)
      .select()
      .single();

    if (error) {
      return { success: false, message: `出勤打刻エラー: ${error.message}` };
    }

    return {
      success: true,
      message: `出勤しました: ${formatDateJP(today)}`,
      data: updated,
    };
  }

  // Create new attendance record
  const { data, error } = await db
    .from("attendance")
    .insert({
      org_id,
      employee_id,
      date: today,
      clock_in: now,
      type: "normal",
    })
    .select()
    .single();

  if (error) {
    return { success: false, message: `出勤打刻エラー: ${error.message}` };
  }

  return {
    success: true,
    message: `出勤しました: ${formatDateJP(today)}`,
    data,
  };
}

async function clockOut(
  db: SupabaseClient,
  params: Record<string, any>,
): Promise<DomainResponse> {
  const { org_id, employee_id } = params;
  if (!org_id || !employee_id) {
    return { success: false, message: "org_id と employee_id は必須です" };
  }

  const today = todayStr();
  const now = new Date().toISOString();

  // Get today's attendance
  const { data: attendance, error: fetchErr } = await db
    .from("attendance")
    .select("*")
    .eq("employee_id", employee_id)
    .eq("date", today)
    .maybeSingle();

  if (fetchErr) {
    return { success: false, message: `勤怠取得エラー: ${fetchErr.message}` };
  }

  if (!attendance || !attendance.clock_in) {
    return { success: false, message: "本日の出勤打刻がありません" };
  }

  if (attendance.clock_out) {
    return {
      success: false,
      message: "本日は既に退勤打刻済みです",
      data: attendance,
    };
  }

  // Calculate work duration
  const clockInTime = new Date(attendance.clock_in).getTime();
  const clockOutTime = new Date(now).getTime();
  const workedMinutes = Math.floor((clockOutTime - clockInTime) / 60000);

  // Calculate break time: if worked > 6 hours, mandatory 60 min break
  const breakMinutes =
    workedMinutes > BREAK_THRESHOLD_MINUTES ? MANDATORY_BREAK_MINUTES : 0;

  // Calculate net work time and overtime
  const netWorkedMinutes = workedMinutes - breakMinutes;
  const overtimeMinutes = Math.max(
    0,
    netWorkedMinutes - STANDARD_WORK_MINUTES,
  );

  const { data: updated, error: updateErr } = await db
    .from("attendance")
    .update({
      clock_out: now,
      break_minutes: breakMinutes,
      overtime_minutes: overtimeMinutes,
    })
    .eq("id", attendance.id)
    .select()
    .single();

  if (updateErr) {
    return { success: false, message: `退勤打刻エラー: ${updateErr.message}` };
  }

  let message = `退勤しました: ${formatDateJP(today)}（勤務: ${formatHours(netWorkedMinutes)}`;
  if (breakMinutes > 0) {
    message += `、休憩: ${formatHours(breakMinutes)}`;
  }
  if (overtimeMinutes > 0) {
    message += `、残業: ${formatHours(overtimeMinutes)}`;
  }
  message += "）";

  return {
    success: true,
    message,
    data: {
      ...updated,
      worked_minutes: workedMinutes,
      net_worked_minutes: netWorkedMinutes,
      worked_formatted: formatHours(netWorkedMinutes),
      break_formatted: formatHours(breakMinutes),
      overtime_formatted: formatHours(overtimeMinutes),
    },
  };
}

async function getAttendance(
  db: SupabaseClient,
  params: Record<string, any>,
): Promise<DomainResponse> {
  const { org_id, employee_id, period } = params;
  if (!org_id || !period) {
    return { success: false, message: "org_id と period は必須です" };
  }

  const { start, end } = parsePeriod(period);

  let query = db
    .from("attendance")
    .select("*, employees!inner(employee_number, department, position)")
    .eq("org_id", org_id)
    .gte("date", start)
    .lte("date", end)
    .order("date", { ascending: true });

  if (employee_id) {
    query = query.eq("employee_id", employee_id);
  }

  const { data, error } = await query;
  if (error) {
    return { success: false, message: `勤怠取得エラー: ${error.message}` };
  }

  const records = data || [];
  const totalWorkedMinutes = records.reduce((sum: number, r: any) => {
    if (r.clock_in && r.clock_out) {
      const worked =
        Math.floor(
          (new Date(r.clock_out).getTime() -
            new Date(r.clock_in).getTime()) /
            60000,
        ) - (r.break_minutes || 0);
      return sum + worked;
    }
    return sum;
  }, 0);
  const totalOvertimeMinutes = records.reduce(
    (sum: number, r: any) => sum + (r.overtime_minutes || 0),
    0,
  );
  const workingDays = records.filter(
    (r: any) => r.type === "normal" && r.clock_in,
  ).length;
  const leaveDays = records.filter(
    (r: any) => r.type === "paid_leave" || r.type === "sick_leave",
  ).length;

  return {
    success: true,
    message: `${period} の勤怠: 出勤${workingDays}日、休暇${leaveDays}日、残業${formatHours(totalOvertimeMinutes)}`,
    data: {
      period,
      records: records.map((r: any) => ({
        ...r,
        date_formatted: formatDateJP(r.date),
      })),
      summary: {
        working_days: workingDays,
        leave_days: leaveDays,
        total_worked_minutes: totalWorkedMinutes,
        total_worked_formatted: formatHours(totalWorkedMinutes),
        total_overtime_minutes: totalOvertimeMinutes,
        total_overtime_formatted: formatHours(totalOvertimeMinutes),
        record_count: records.length,
      },
    },
  };
}

async function requestLeave(
  db: SupabaseClient,
  params: Record<string, any>,
): Promise<DomainResponse> {
  const { org_id, employee_id, date, type } = params;
  if (!org_id || !employee_id || !date || !type) {
    return {
      success: false,
      message: "org_id, employee_id, date, type は必須です",
    };
  }

  const validTypes = ["paid_leave", "sick_leave"];
  if (!validTypes.includes(type)) {
    return {
      success: false,
      message: `type は ${validTypes.join(", ")} のいずれかで指定してください`,
    };
  }

  // Check remaining leave balance
  const { data: employee, error: empErr } = await db
    .from("employees")
    .select("paid_leave_total, paid_leave_used")
    .eq("id", employee_id)
    .eq("org_id", org_id)
    .single();

  if (empErr || !employee) {
    return { success: false, message: "従業員情報が見つかりません" };
  }

  if (
    type === "paid_leave" &&
    employee.paid_leave_used >= employee.paid_leave_total
  ) {
    return {
      success: false,
      message: `有給休暇の残日数がありません（使用済み: ${employee.paid_leave_used}日 / 付与: ${employee.paid_leave_total}日）`,
    };
  }

  // Check if attendance record already exists for this date
  const { data: existing } = await db
    .from("attendance")
    .select("id")
    .eq("employee_id", employee_id)
    .eq("date", date)
    .maybeSingle();

  if (existing) {
    return {
      success: false,
      message: `${formatDateJP(date)} は既に勤怠記録があります`,
    };
  }

  // Create attendance record for leave
  const { data: attendance, error: attErr } = await db
    .from("attendance")
    .insert({
      org_id,
      employee_id,
      date,
      type,
      break_minutes: 0,
      overtime_minutes: 0,
    })
    .select()
    .single();

  if (attErr) {
    return { success: false, message: `休暇登録エラー: ${attErr.message}` };
  }

  // Create approval request
  const { error: approvalErr } = await db.from("approval_requests").insert({
    org_id,
    requester_id:
      (
        await db
          .from("employees")
          .select("user_id")
          .eq("id", employee_id)
          .single()
      ).data?.user_id || employee_id,
    domain: "hr",
    type: "leave_request",
    data: {
      employee_id,
      date,
      leave_type: type,
      attendance_id: attendance.id,
    },
    status: "pending",
  });

  if (approvalErr) {
    console.error("Approval request creation failed:", approvalErr.message);
  }

  // Update used leave count if paid_leave
  if (type === "paid_leave") {
    await db
      .from("employees")
      .update({ paid_leave_used: employee.paid_leave_used + 1 })
      .eq("id", employee_id);
  }

  const typeLabel = type === "paid_leave" ? "有給休暇" : "病気休暇";
  const remaining =
    type === "paid_leave"
      ? employee.paid_leave_total - employee.paid_leave_used - 1
      : null;

  return {
    success: true,
    message: `${formatDateJP(date)} の${typeLabel}を申請しました${remaining !== null ? `（残り${remaining}日）` : ""}`,
    data: {
      attendance,
      date_formatted: formatDateJP(date),
      leave_type: typeLabel,
      remaining_paid_leave: remaining,
    },
  };
}

async function getLeaveBalance(
  db: SupabaseClient,
  params: Record<string, any>,
): Promise<DomainResponse> {
  const { org_id, employee_id } = params;
  if (!org_id || !employee_id) {
    return { success: false, message: "org_id と employee_id は必須です" };
  }

  const { data: employee, error } = await db
    .from("employees")
    .select("paid_leave_total, paid_leave_used, employee_number")
    .eq("id", employee_id)
    .eq("org_id", org_id)
    .single();

  if (error || !employee) {
    return { success: false, message: "従業員情報が見つかりません" };
  }

  const remaining = employee.paid_leave_total - employee.paid_leave_used;

  return {
    success: true,
    message: `有給残日数: ${remaining}日（付与: ${employee.paid_leave_total}日、使用済み: ${employee.paid_leave_used}日）`,
    data: {
      employee_number: employee.employee_number,
      paid_leave_total: employee.paid_leave_total,
      paid_leave_used: employee.paid_leave_used,
      paid_leave_remaining: remaining,
    },
  };
}

async function getOvertime(
  db: SupabaseClient,
  params: Record<string, any>,
): Promise<DomainResponse> {
  const { org_id, employee_id, period } = params;
  if (!org_id || !period) {
    return { success: false, message: "org_id と period は必須です" };
  }

  const { start, end } = parsePeriod(period);

  let query = db
    .from("attendance")
    .select(
      "employee_id, overtime_minutes, date, employees!inner(employee_number, department, position, user_id)",
    )
    .eq("org_id", org_id)
    .gte("date", start)
    .lte("date", end)
    .gt("overtime_minutes", 0)
    .order("date", { ascending: true });

  if (employee_id) {
    query = query.eq("employee_id", employee_id);
  }

  const { data, error } = await query;
  if (error) {
    return { success: false, message: `残業取得エラー: ${error.message}` };
  }

  const records = data || [];

  // Group by employee
  const byEmployee: Record<string, { total: number; records: any[] }> = {};
  for (const r of records) {
    if (!byEmployee[r.employee_id]) {
      byEmployee[r.employee_id] = { total: 0, records: [] };
    }
    byEmployee[r.employee_id].total += r.overtime_minutes;
    byEmployee[r.employee_id].records.push(r);
  }

  const totalOvertimeMinutes = records.reduce(
    (sum: number, r: any) => sum + r.overtime_minutes,
    0,
  );

  // Check 36 agreement warnings
  const warnings: string[] = [];
  for (const [empId, data] of Object.entries(byEmployee)) {
    if (data.total >= OVERTIME_MONTHLY_LIMIT_MINUTES) {
      const empInfo = data.records[0]?.employees;
      const empLabel = empInfo?.employee_number || empId;
      warnings.push(
        `${empLabel}: ${formatHours(data.total)}（36協定上限${formatHours(OVERTIME_MONTHLY_LIMIT_MINUTES)}超過）`,
      );
    } else if (data.total >= OVERTIME_MONTHLY_LIMIT_MINUTES * 0.8) {
      const empInfo = data.records[0]?.employees;
      const empLabel = empInfo?.employee_number || empId;
      warnings.push(
        `${empLabel}: ${formatHours(data.total)}（36協定上限の80%超過 - 注意）`,
      );
    }
  }

  let message = `${period} の残業合計: ${formatHours(totalOvertimeMinutes)}`;
  if (warnings.length > 0) {
    message += `\n\u26a0\ufe0f 36協定警告:\n${warnings.join("\n")}`;
  }

  return {
    success: true,
    message,
    data: {
      period,
      total_overtime_minutes: totalOvertimeMinutes,
      total_overtime_formatted: formatHours(totalOvertimeMinutes),
      by_employee: Object.fromEntries(
        Object.entries(byEmployee).map(([empId, d]) => [
          empId,
          {
            total_minutes: d.total,
            total_formatted: formatHours(d.total),
            exceeds_limit: d.total >= OVERTIME_MONTHLY_LIMIT_MINUTES,
            limit_percentage: Math.round(
              (d.total / OVERTIME_MONTHLY_LIMIT_MINUTES) * 100,
            ),
            records: d.records.map((r: any) => ({
              date: r.date,
              date_formatted: formatDateJP(r.date),
              overtime_minutes: r.overtime_minutes,
              overtime_formatted: formatHours(r.overtime_minutes),
            })),
          },
        ]),
      ),
      warnings,
      limit_minutes: OVERTIME_MONTHLY_LIMIT_MINUTES,
      limit_formatted: formatHours(OVERTIME_MONTHLY_LIMIT_MINUTES),
    },
  };
}

async function getPayroll(
  db: SupabaseClient,
  params: Record<string, any>,
): Promise<DomainResponse> {
  const { org_id, employee_id, period } = params;
  if (!org_id || !period) {
    return { success: false, message: "org_id と period は必須です" };
  }

  let query = db
    .from("payroll")
    .select(
      "*, employees!inner(employee_number, department, position)",
    )
    .eq("org_id", org_id)
    .eq("period", period)
    .order("created_at", { ascending: false });

  if (employee_id) {
    query = query.eq("employee_id", employee_id);
  }

  const { data, error } = await query;
  if (error) {
    return { success: false, message: `給与取得エラー: ${error.message}` };
  }

  const records = data || [];
  const totalNetPay = records.reduce(
    (sum: number, r: any) => sum + Number(r.net_pay),
    0,
  );
  const totalBaseSalary = records.reduce(
    (sum: number, r: any) => sum + Number(r.base_salary),
    0,
  );
  const totalOvertimePay = records.reduce(
    (sum: number, r: any) => sum + Number(r.overtime_pay),
    0,
  );

  return {
    success: true,
    message: `${period} の給与: ${records.length}名分、支給総額 ${formatYen(totalNetPay)}`,
    data: {
      period,
      records: records.map((r: any) => ({
        ...r,
        base_salary_formatted: formatYen(Number(r.base_salary)),
        overtime_pay_formatted: formatYen(Number(r.overtime_pay)),
        net_pay_formatted: formatYen(Number(r.net_pay)),
      })),
      summary: {
        employee_count: records.length,
        total_base_salary: totalBaseSalary,
        total_base_salary_formatted: formatYen(totalBaseSalary),
        total_overtime_pay: totalOvertimePay,
        total_overtime_pay_formatted: formatYen(totalOvertimePay),
        total_net_pay: totalNetPay,
        total_net_pay_formatted: formatYen(totalNetPay),
      },
    },
  };
}

async function calculatePayroll(
  db: SupabaseClient,
  params: Record<string, any>,
): Promise<DomainResponse> {
  const { org_id, period } = params;
  if (!org_id || !period) {
    return { success: false, message: "org_id と period は必須です" };
  }

  const { start, end } = parsePeriod(period);

  // Get all employees for this org
  const { data: employees, error: empErr } = await db
    .from("employees")
    .select("id, employee_number, salary_monthly, department, position")
    .eq("org_id", org_id);

  if (empErr) {
    return { success: false, message: `従業員取得エラー: ${empErr.message}` };
  }

  if (!employees || employees.length === 0) {
    return { success: false, message: "対象の従業員がいません" };
  }

  const results: any[] = [];
  const errors: string[] = [];

  for (const emp of employees) {
    // Get attendance for the period
    const { data: attendance } = await db
      .from("attendance")
      .select("overtime_minutes")
      .eq("employee_id", emp.id)
      .gte("date", start)
      .lte("date", end);

    const totalOvertimeMinutes = (attendance || []).reduce(
      (sum: number, a: any) => sum + (a.overtime_minutes || 0),
      0,
    );

    // Calculate overtime pay: base hourly * 1.25 for overtime
    // Hourly rate = monthly salary / (8h * 20 working days)
    const baseSalary = Number(emp.salary_monthly);
    const hourlyRate = baseSalary / (8 * 20);
    const overtimePay = Math.floor(
      (totalOvertimeMinutes / 60) * hourlyRate * 1.25,
    );

    // Standard deductions (simplified)
    const grossPay = baseSalary + overtimePay;
    const healthInsurance = Math.floor(grossPay * 0.05); // ~5% health insurance
    const pension = Math.floor(grossPay * 0.0915); // ~9.15% pension
    const employmentInsurance = Math.floor(grossPay * 0.003); // ~0.3% employment insurance
    const incomeTax = Math.floor(grossPay * 0.05); // simplified income tax withholding
    const totalDeductions =
      healthInsurance + pension + employmentInsurance + incomeTax;
    const netPay = grossPay - totalDeductions;

    const deductions = {
      health_insurance: healthInsurance,
      pension,
      employment_insurance: employmentInsurance,
      income_tax: incomeTax,
      total: totalDeductions,
    };

    // Upsert payroll record
    const { data: payrollRecord, error: payErr } = await db
      .from("payroll")
      .upsert(
        {
          org_id,
          employee_id: emp.id,
          period,
          base_salary: baseSalary,
          overtime_pay: overtimePay,
          deductions,
          net_pay: netPay,
        },
        { onConflict: "employee_id,period" },
      )
      .select()
      .single();

    if (payErr) {
      errors.push(`${emp.employee_number}: ${payErr.message}`);
    } else {
      results.push({
        ...payrollRecord,
        employee_number: emp.employee_number,
        department: emp.department,
        overtime_minutes: totalOvertimeMinutes,
        overtime_formatted: formatHours(totalOvertimeMinutes),
        base_salary_formatted: formatYen(baseSalary),
        overtime_pay_formatted: formatYen(overtimePay),
        gross_pay: grossPay,
        gross_pay_formatted: formatYen(grossPay),
        deductions_formatted: formatYen(totalDeductions),
        net_pay_formatted: formatYen(netPay),
      });
    }
  }

  const totalNetPay = results.reduce(
    (sum: number, r: any) => sum + Number(r.net_pay),
    0,
  );

  let message = `${period} の給与計算完了: ${results.length}名分、支給総額 ${formatYen(totalNetPay)}`;
  if (errors.length > 0) {
    message += `\n\u26a0\ufe0f エラー: ${errors.join(", ")}`;
  }

  return {
    success: true,
    message,
    data: {
      period,
      payroll_records: results,
      errors,
      summary: {
        processed: results.length,
        failed: errors.length,
        total_net_pay: totalNetPay,
        total_net_pay_formatted: formatYen(totalNetPay),
      },
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
  clock_in: clockIn,
  clock_out: clockOut,
  get_attendance: getAttendance,
  request_leave: requestLeave,
  get_leave_balance: getLeaveBalance,
  get_overtime: getOvertime,
  get_payroll: getPayroll,
  calculate_payroll: calculatePayroll,
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
        message: "action と params は必須です",
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
    console.error("domain-hr error:", err);
    return json(500, {
      success: false,
      message: `内部エラーが発生しました: ${(err as Error).message}`,
    });
  }
});
