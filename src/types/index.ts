// 組織
export interface Org {
  id: string
  name: string
  plan: 'lite' | 'pro' | 'enterprise'
  created_at: string
}

// 従業員
export interface Employee {
  id: string
  org_id: string
  name: string
  email: string
  department: string
  position: string
  hire_date: string
  status: 'active' | 'inactive' | 'on_leave'
}

// 勤怠
export interface Attendance {
  id: string
  employee_id: string
  employee_name: string
  date: string
  clock_in: string | null
  clock_out: string | null
  overtime_hours: number
  status: 'normal' | 'late' | 'absent' | 'holiday' | 'paid_leave'
}

// 有給残高
export interface LeaveBalance {
  employee_id: string
  employee_name: string
  department: string
  total_days: number
  used_days: number
  remaining_days: number
}

// 連絡先（CRM）
export interface Contact {
  id: string
  org_id: string
  company_name: string
  person_name: string
  email: string
  phone: string
  source: 'teleapo' | 'web' | 'referral' | 'exhibition'
  created_at: string
}

// 商談
export interface Deal {
  id: string
  org_id: string
  contact_id: string
  contact_name: string
  company_name: string
  title: string
  amount: number
  stage: 'lead' | 'proposal' | 'negotiation' | 'won' | 'lost'
  probability: number
  expected_close_date: string
  assigned_to: string
  created_at: string
  updated_at: string
}

// やりとり（CRM）
export interface Interaction {
  id: string
  contact_id: string
  contact_name: string
  company_name: string
  type: 'call' | 'email' | 'meeting' | 'line'
  summary: string
  date: string
  created_by: string
}

// テレアポスケジュール
export interface TeleapoSchedule {
  id: string
  contact_name: string
  company_name: string
  phone: string
  scheduled_at: string
  status: 'scheduled' | 'completed' | 'no_answer' | 'callback'
  result?: string
  assigned_to: string
}

// 請求書
export interface Invoice {
  id: string
  org_id: string
  client_name: string
  invoice_number: string
  amount: number
  tax_amount: number
  total_amount: number
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
  issue_date: string
  due_date: string
  paid_date?: string
}

// 経費
export interface Expense {
  id: string
  org_id: string
  employee_name: string
  category: string
  description: string
  amount: number
  receipt_url?: string
  status: 'pending' | 'approved' | 'rejected'
  submitted_at: string
  approved_by?: string
}

// PL（損益）
export interface PLSummary {
  month: string
  revenue: number
  cost_of_sales: number
  gross_profit: number
  operating_expenses: number
  operating_income: number
}

// ドキュメント
export interface Document {
  id: string
  org_id: string
  title: string
  category: 'contract' | 'invoice' | 'report' | 'manual' | 'template' | 'other'
  file_url: string
  file_type: string
  uploaded_by: string
  uploaded_at: string
  tags: string[]
}

// 備品
export interface Equipment {
  id: string
  org_id: string
  name: string
  category: string
  serial_number?: string
  assigned_to?: string
  status: 'available' | 'in_use' | 'maintenance' | 'disposed'
  purchase_date: string
  purchase_price: number
}

// オフィスリクエスト
export interface OfficeRequest {
  id: string
  org_id: string
  requested_by: string
  type: 'supply' | 'maintenance' | 'it_support' | 'other'
  title: string
  description: string
  status: 'pending' | 'in_progress' | 'completed' | 'rejected'
  priority: 'low' | 'medium' | 'high'
  created_at: string
  resolved_at?: string
}

// AI操作ログ
export interface AuditLogEntry {
  id: string
  org_id: string
  user_name: string
  domain: 'accounting' | 'hr' | 'crm' | 'documents' | 'general'
  intent: string
  action: string
  detail: string
  success: boolean
  timestamp: string
}

// 月次売上データ（チャート用）
export interface MonthlyRevenue {
  month: string
  revenue: number
  expenses: number
  profit?: number
}

// KPIスパークラインデータ
export interface SparklinePoint {
  value: number
}

// キャッシュフロー予測
export interface CashFlowForecast {
  month: string
  inflow: number
  outflow: number
  net: number
}

// 経費カテゴリ
export interface ExpenseCategory {
  name: string
  value: number
  percentage: number
  color: string
}

// 売掛金エージング
export interface ReceivableAging {
  category: string
  amount: number
  color: string
}

// パイプラインファネル
export interface PipelineFunnel {
  stage: string
  label: string
  amount: number
  count: number
  conversionRate?: number
}

// 承認待ちタスク
export interface PendingApproval {
  id: string
  avatar: string
  name: string
  description: string
  amount: number
  timeAgo: string
  type: 'expense' | 'leave' | 'purchase' | 'contract'
}

// AI操作ログ（ダッシュボード用タイムライン）
export interface DashboardAuditLog {
  id: string
  icon: string
  domain: 'accounting' | 'hr' | 'crm' | 'documents' | 'general'
  userName: string
  action: string
  timestamp: string
}
