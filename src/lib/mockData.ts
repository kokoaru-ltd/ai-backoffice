import type {
  Employee,
  Attendance,
  LeaveBalance,
  Contact,
  Deal,
  Interaction,
  TeleapoSchedule,
  Invoice,
  Expense,
  PLSummary,
  Document,
  Equipment,
  OfficeRequest,
  AuditLogEntry,
  MonthlyRevenue,
  SparklinePoint,
  CashFlowForecast,
  ExpenseCategory,
  ReceivableAging,
  PipelineFunnel,
  PendingApproval,
  DashboardAuditLog,
  PaymentScheduleItem,
  AccountsReceivableItem,
  JournalEntry,
  ExpenseCategoryDonut,
  MonthlyOvertime,
  DepartmentOvertime,
  MonthlyAttendanceSummary,
  SalesForecast,
  TeleapoDailyStats,
  DocTemplate,
  DocumentExtended,
  EquipmentExtended,
  AuditLogExtended,
} from '../types'

// ── 従業員 ──
export const mockEmployees: Employee[] = [
  { id: 'e1', org_id: 'org1', name: '田中 太郎', email: 'tanaka@example.co.jp', department: '営業部', position: '部長', hire_date: '2018-04-01', status: 'active' },
  { id: 'e2', org_id: 'org1', name: '鈴木 花子', email: 'suzuki@example.co.jp', department: '経理部', position: '主任', hire_date: '2019-07-15', status: 'active' },
  { id: 'e3', org_id: 'org1', name: '佐藤 健一', email: 'sato@example.co.jp', department: '営業部', position: '係長', hire_date: '2020-01-10', status: 'active' },
  { id: 'e4', org_id: 'org1', name: '山田 美咲', email: 'yamada@example.co.jp', department: '人事部', position: '担当', hire_date: '2021-04-01', status: 'active' },
  { id: 'e5', org_id: 'org1', name: '高橋 翔太', email: 'takahashi@example.co.jp', department: '開発部', position: 'リーダー', hire_date: '2019-10-01', status: 'active' },
  { id: 'e6', org_id: 'org1', name: '伊藤 愛', email: 'ito@example.co.jp', department: '営業部', position: '担当', hire_date: '2022-04-01', status: 'active' },
  { id: 'e7', org_id: 'org1', name: '渡辺 大輝', email: 'watanabe@example.co.jp', department: '開発部', position: '担当', hire_date: '2022-07-01', status: 'active' },
  { id: 'e8', org_id: 'org1', name: '中村 さくら', email: 'nakamura@example.co.jp', department: '総務部', position: '主任', hire_date: '2020-04-01', status: 'on_leave' },
]

// ── 勤怠（今月） ──
export const mockAttendance: Attendance[] = [
  { id: 'a1', employee_id: 'e1', employee_name: '田中 太郎', date: '2026-02-20', clock_in: '08:45', clock_out: '21:30', overtime_hours: 3.5, status: 'normal' },
  { id: 'a2', employee_id: 'e2', employee_name: '鈴木 花子', date: '2026-02-20', clock_in: '09:00', clock_out: '18:00', overtime_hours: 0, status: 'normal' },
  { id: 'a3', employee_id: 'e3', employee_name: '佐藤 健一', date: '2026-02-20', clock_in: '09:35', clock_out: '20:15', overtime_hours: 2.0, status: 'late' },
  { id: 'a4', employee_id: 'e4', employee_name: '山田 美咲', date: '2026-02-20', clock_in: '08:55', clock_out: '18:30', overtime_hours: 0.5, status: 'normal' },
  { id: 'a5', employee_id: 'e5', employee_name: '高橋 翔太', date: '2026-02-20', clock_in: '09:00', clock_out: '22:00', overtime_hours: 4.0, status: 'normal' },
  { id: 'a6', employee_id: 'e6', employee_name: '伊藤 愛', date: '2026-02-20', clock_in: null, clock_out: null, overtime_hours: 0, status: 'paid_leave' },
  { id: 'a7', employee_id: 'e7', employee_name: '渡辺 大輝', date: '2026-02-20', clock_in: '08:50', clock_out: '21:00', overtime_hours: 3.0, status: 'normal' },
  { id: 'a8', employee_id: 'e8', employee_name: '中村 さくら', date: '2026-02-20', clock_in: null, clock_out: null, overtime_hours: 0, status: 'absent' },
]

// ── 残業ランキング（月間累計） ──
export const mockOvertimeRanking = [
  { name: '高橋 翔太', department: '開発部', hours: 42.5 },
  { name: '田中 太郎', department: '営業部', hours: 38.0 },
  { name: '渡辺 大輝', department: '開発部', hours: 35.5 },
  { name: '佐藤 健一', department: '営業部', hours: 28.0 },
  { name: '山田 美咲', department: '人事部', hours: 12.5 },
  { name: '鈴木 花子', department: '経理部', hours: 8.0 },
  { name: '伊藤 愛', department: '営業部', hours: 5.0 },
]

// ── 有給残高 ──
export const mockLeaveBalances: LeaveBalance[] = [
  { employee_id: 'e1', employee_name: '田中 太郎', department: '営業部', total_days: 20, used_days: 8, remaining_days: 12 },
  { employee_id: 'e2', employee_name: '鈴木 花子', department: '経理部', total_days: 20, used_days: 5, remaining_days: 15 },
  { employee_id: 'e3', employee_name: '佐藤 健一', department: '営業部', total_days: 15, used_days: 3, remaining_days: 12 },
  { employee_id: 'e4', employee_name: '山田 美咲', department: '人事部', total_days: 12, used_days: 2, remaining_days: 10 },
  { employee_id: 'e5', employee_name: '高橋 翔太', department: '開発部', total_days: 20, used_days: 4, remaining_days: 16 },
  { employee_id: 'e6', employee_name: '伊藤 愛', department: '営業部', total_days: 12, used_days: 6, remaining_days: 6 },
  { employee_id: 'e7', employee_name: '渡辺 大輝', department: '開発部', total_days: 12, used_days: 1, remaining_days: 11 },
  { employee_id: 'e8', employee_name: '中村 さくら', department: '総務部', total_days: 15, used_days: 15, remaining_days: 0 },
]

// ── 連絡先 ──
export const mockContacts: Contact[] = [
  { id: 'c1', org_id: 'org1', company_name: '株式会社サクラテック', person_name: '松本 一郎', email: 'matsumoto@sakuratech.co.jp', phone: '03-1234-5678', source: 'teleapo', created_at: '2026-01-15' },
  { id: 'c2', org_id: 'org1', company_name: '東京デジタル株式会社', person_name: '小林 恵子', email: 'kobayashi@tokyodigital.co.jp', phone: '03-2345-6789', source: 'web', created_at: '2026-01-20' },
  { id: 'c3', org_id: 'org1', company_name: '合同会社ミライソリューション', person_name: '加藤 修', email: 'kato@mirai-sol.co.jp', phone: '06-3456-7890', source: 'referral', created_at: '2026-02-01' },
  { id: 'c4', org_id: 'org1', company_name: '株式会社グローバルコネクト', person_name: '吉田 真由美', email: 'yoshida@globalconnect.co.jp', phone: '03-4567-8901', source: 'exhibition', created_at: '2026-02-05' },
  { id: 'c5', org_id: 'org1', company_name: '大阪商事株式会社', person_name: '森田 浩二', email: 'morita@osaka-shoji.co.jp', phone: '06-5678-9012', source: 'teleapo', created_at: '2026-02-10' },
]

// ── 商談 ──
export const mockDeals: Deal[] = [
  { id: 'd1', org_id: 'org1', contact_id: 'c1', contact_name: '松本 一郎', company_name: '株式会社サクラテック', title: 'AI導入コンサルティング', amount: 3500000, stage: 'won', probability: 100, expected_close_date: '2026-02-28', assigned_to: '田中 太郎', created_at: '2026-01-15', updated_at: '2026-02-18' },
  { id: 'd2', org_id: 'org1', contact_id: 'c2', contact_name: '小林 恵子', company_name: '東京デジタル株式会社', title: 'クラウド移行プロジェクト', amount: 8500000, stage: 'negotiation', probability: 60, expected_close_date: '2026-03-15', assigned_to: '田中 太郎', created_at: '2026-01-20', updated_at: '2026-02-20' },
  { id: 'd3', org_id: 'org1', contact_id: 'c3', contact_name: '加藤 修', company_name: '合同会社ミライソリューション', title: 'DX推進支援パッケージ', amount: 5000000, stage: 'proposal', probability: 40, expected_close_date: '2026-04-01', assigned_to: '佐藤 健一', created_at: '2026-02-01', updated_at: '2026-02-19' },
  { id: 'd4', org_id: 'org1', contact_id: 'c4', contact_name: '吉田 真由美', company_name: '株式会社グローバルコネクト', title: 'セキュリティ診断サービス', amount: 2000000, stage: 'lead', probability: 20, expected_close_date: '2026-04-30', assigned_to: '伊藤 愛', created_at: '2026-02-05', updated_at: '2026-02-15' },
  { id: 'd5', org_id: 'org1', contact_id: 'c5', contact_name: '森田 浩二', company_name: '大阪商事株式会社', title: '業務自動化ツール導入', amount: 4200000, stage: 'proposal', probability: 50, expected_close_date: '2026-03-31', assigned_to: '佐藤 健一', created_at: '2026-02-10', updated_at: '2026-02-20' },
  { id: 'd6', org_id: 'org1', contact_id: 'c1', contact_name: '松本 一郎', company_name: '株式会社サクラテック', title: '追加開発案件', amount: 1500000, stage: 'negotiation', probability: 70, expected_close_date: '2026-03-10', assigned_to: '田中 太郎', created_at: '2026-02-12', updated_at: '2026-02-21' },
  { id: 'd7', org_id: 'org1', contact_id: 'c2', contact_name: '小林 恵子', company_name: '東京デジタル株式会社', title: '旧システム保守', amount: 1200000, stage: 'lost', probability: 0, expected_close_date: '2026-02-15', assigned_to: '佐藤 健一', created_at: '2025-12-01', updated_at: '2026-02-15' },
  { id: 'd8', org_id: 'org1', contact_id: 'c3', contact_name: '加藤 修', company_name: '合同会社ミライソリューション', title: 'データ分析基盤構築', amount: 6000000, stage: 'lead', probability: 15, expected_close_date: '2026-05-01', assigned_to: '伊藤 愛', created_at: '2026-02-18', updated_at: '2026-02-20' },
]

// ── やりとり ──
export const mockInteractions: Interaction[] = [
  { id: 'i1', contact_id: 'c1', contact_name: '松本 一郎', company_name: '株式会社サクラテック', type: 'meeting', summary: '契約条件の最終確認を実施。来週中に契約書送付予定。', date: '2026-02-20', created_by: '田中 太郎' },
  { id: 'i2', contact_id: 'c2', contact_name: '小林 恵子', company_name: '東京デジタル株式会社', type: 'call', summary: '見積もり内容について質問あり。追加オプションの説明を行った。', date: '2026-02-19', created_by: '田中 太郎' },
  { id: 'i3', contact_id: 'c3', contact_name: '加藤 修', company_name: '合同会社ミライソリューション', type: 'email', summary: '提案書を送付。返信待ち。', date: '2026-02-18', created_by: '佐藤 健一' },
  { id: 'i4', contact_id: 'c5', contact_name: '森田 浩二', company_name: '大阪商事株式会社', type: 'call', summary: 'テレアポにて初回コンタクト。課題感あり、資料送付依頼。', date: '2026-02-17', created_by: '伊藤 愛' },
  { id: 'i5', contact_id: 'c4', contact_name: '吉田 真由美', company_name: '株式会社グローバルコネクト', type: 'line', summary: 'LINE公式からの問い合わせ。デモ依頼。', date: '2026-02-16', created_by: '伊藤 愛' },
]

// ── テレアポスケジュール ──
export const mockTeleapoSchedule: TeleapoSchedule[] = [
  { id: 't1', contact_name: '木村 隆', company_name: '株式会社ネクストワン', phone: '03-6789-0123', scheduled_at: '2026-02-23 10:00', status: 'scheduled', assigned_to: '伊藤 愛' },
  { id: 't2', contact_name: '林 美穂', company_name: 'エムテック株式会社', phone: '03-7890-1234', scheduled_at: '2026-02-23 11:00', status: 'scheduled', assigned_to: '伊藤 愛' },
  { id: 't3', contact_name: '清水 正人', company_name: '株式会社フューチャーラボ', phone: '045-890-1234', scheduled_at: '2026-02-23 14:00', status: 'scheduled', assigned_to: '佐藤 健一' },
  { id: 't4', contact_name: '井上 貴子', company_name: 'アクセル合同会社', phone: '03-0123-4567', scheduled_at: '2026-02-21 10:00', status: 'completed', result: 'アポ獲得・3/5訪問予定', assigned_to: '伊藤 愛' },
  { id: 't5', contact_name: '斉藤 剛', company_name: '株式会社ブルースカイ', phone: '06-1234-5678', scheduled_at: '2026-02-21 14:00', status: 'no_answer', assigned_to: '佐藤 健一' },
  { id: 't6', contact_name: '小川 裕子', company_name: 'ライトハウス株式会社', phone: '03-2345-6789', scheduled_at: '2026-02-22 11:00', status: 'callback', result: '来週改めて電話希望', assigned_to: '伊藤 愛' },
]

// ── 請求書 ──
export const mockInvoices: Invoice[] = [
  { id: 'inv1', org_id: 'org1', client_name: '株式会社サクラテック', invoice_number: 'INV-2026-0045', amount: 3500000, tax_amount: 350000, total_amount: 3850000, status: 'paid', issue_date: '2026-02-01', due_date: '2026-02-28', paid_date: '2026-02-15' },
  { id: 'inv2', org_id: 'org1', client_name: '株式会社ABC商事', invoice_number: 'INV-2026-0044', amount: 2800000, tax_amount: 280000, total_amount: 3080000, status: 'sent', issue_date: '2026-02-01', due_date: '2026-02-28' },
  { id: 'inv3', org_id: 'org1', client_name: '日本テクノ株式会社', invoice_number: 'INV-2026-0043', amount: 1500000, tax_amount: 150000, total_amount: 1650000, status: 'overdue', issue_date: '2026-01-15', due_date: '2026-02-14' },
  { id: 'inv4', org_id: 'org1', client_name: '合同会社ミライソリューション', invoice_number: 'INV-2026-0046', amount: 950000, tax_amount: 95000, total_amount: 1045000, status: 'draft', issue_date: '2026-02-20', due_date: '2026-03-20' },
  { id: 'inv5', org_id: 'org1', client_name: '東京デジタル株式会社', invoice_number: 'INV-2026-0042', amount: 4200000, tax_amount: 420000, total_amount: 4620000, status: 'paid', issue_date: '2026-01-01', due_date: '2026-01-31', paid_date: '2026-01-28' },
]

// ── 経費 ──
export const mockExpenses: Expense[] = [
  { id: 'exp1', org_id: 'org1', employee_name: '田中 太郎', category: '交通費', description: '東京→大阪 新幹線往復（サクラテック商談）', amount: 27500, status: 'approved', submitted_at: '2026-02-18', approved_by: '鈴木 花子' },
  { id: 'exp2', org_id: 'org1', employee_name: '佐藤 健一', category: '接待交際費', description: '顧客会食（ミライソリューション）', amount: 35000, status: 'pending', submitted_at: '2026-02-19' },
  { id: 'exp3', org_id: 'org1', employee_name: '伊藤 愛', category: '消耗品費', description: '名刺印刷 500枚', amount: 8500, status: 'approved', submitted_at: '2026-02-15', approved_by: '鈴木 花子' },
  { id: 'exp4', org_id: 'org1', employee_name: '高橋 翔太', category: '通信費', description: 'AWS利用料（2月分）', amount: 125000, status: 'pending', submitted_at: '2026-02-20' },
  { id: 'exp5', org_id: 'org1', employee_name: '田中 太郎', category: '交通費', description: 'タクシー代（深夜帰宅）', amount: 4800, status: 'rejected', submitted_at: '2026-02-17' },
  { id: 'exp6', org_id: 'org1', employee_name: '渡辺 大輝', category: '消耗品費', description: '外部モニター購入', amount: 45000, status: 'pending', submitted_at: '2026-02-21' },
]

// ── PL ──
export const mockPLSummary: PLSummary[] = [
  { month: '2025年3月', revenue: 10800000, cost_of_sales: 4300000, gross_profit: 6500000, operating_expenses: 4200000, operating_income: 2300000 },
  { month: '2025年4月', revenue: 11500000, cost_of_sales: 4600000, gross_profit: 6900000, operating_expenses: 4300000, operating_income: 2600000 },
  { month: '2025年5月', revenue: 12200000, cost_of_sales: 4900000, gross_profit: 7300000, operating_expenses: 4400000, operating_income: 2900000 },
  { month: '2025年6月', revenue: 13000000, cost_of_sales: 5200000, gross_profit: 7800000, operating_expenses: 4500000, operating_income: 3300000 },
  { month: '2025年7月', revenue: 11900000, cost_of_sales: 4800000, gross_profit: 7100000, operating_expenses: 4400000, operating_income: 2700000 },
  { month: '2025年8月', revenue: 10500000, cost_of_sales: 4200000, gross_profit: 6300000, operating_expenses: 4100000, operating_income: 2200000 },
  { month: '2025年9月', revenue: 12500000, cost_of_sales: 5000000, gross_profit: 7500000, operating_expenses: 4500000, operating_income: 3000000 },
  { month: '2025年10月', revenue: 14200000, cost_of_sales: 5600000, gross_profit: 8600000, operating_expenses: 4800000, operating_income: 3800000 },
  { month: '2025年11月', revenue: 11800000, cost_of_sales: 4700000, gross_profit: 7100000, operating_expenses: 4600000, operating_income: 2500000 },
  { month: '2025年12月', revenue: 16500000, cost_of_sales: 6200000, gross_profit: 10300000, operating_expenses: 5200000, operating_income: 5100000 },
  { month: '2026年1月', revenue: 13800000, cost_of_sales: 5500000, gross_profit: 8300000, operating_expenses: 4900000, operating_income: 3400000 },
  { month: '2026年2月', revenue: 15200000, cost_of_sales: 5800000, gross_profit: 9400000, operating_expenses: 5000000, operating_income: 4400000 },
]

// ── 月次売上（チャート用 12ヶ月） ──
export const mockMonthlyRevenue: MonthlyRevenue[] = [
  { month: '3月', revenue: 10800000, expenses: 8500000, profit: 2300000 },
  { month: '4月', revenue: 11500000, expenses: 8900000, profit: 2600000 },
  { month: '5月', revenue: 12200000, expenses: 9300000, profit: 2900000 },
  { month: '6月', revenue: 13000000, expenses: 9700000, profit: 3300000 },
  { month: '7月', revenue: 11900000, expenses: 9200000, profit: 2700000 },
  { month: '8月', revenue: 10500000, expenses: 8300000, profit: 2200000 },
  { month: '9月', revenue: 12500000, expenses: 9500000, profit: 3000000 },
  { month: '10月', revenue: 14200000, expenses: 10400000, profit: 3800000 },
  { month: '11月', revenue: 11800000, expenses: 9300000, profit: 2500000 },
  { month: '12月', revenue: 16500000, expenses: 11400000, profit: 5100000 },
  { month: '1月', revenue: 13800000, expenses: 10400000, profit: 3400000 },
  { month: '2月', revenue: 15200000, expenses: 10800000, profit: 4400000 },
]

// ── ドキュメント ──
export const mockDocuments: Document[] = [
  { id: 'doc1', org_id: 'org1', title: '就業規則（最新版）', category: 'manual', file_url: '#', file_type: 'pdf', uploaded_by: '山田 美咲', uploaded_at: '2026-01-10', tags: ['人事', '規則'] },
  { id: 'doc2', org_id: 'org1', title: 'サクラテック業務委託契約書', category: 'contract', file_url: '#', file_type: 'pdf', uploaded_by: '田中 太郎', uploaded_at: '2026-02-01', tags: ['契約', 'サクラテック'] },
  { id: 'doc3', org_id: 'org1', title: '2026年2月度月次レポート', category: 'report', file_url: '#', file_type: 'pdf', uploaded_by: '鈴木 花子', uploaded_at: '2026-02-20', tags: ['レポート', '月次'] },
  { id: 'doc4', org_id: 'org1', title: '見積書テンプレート', category: 'template', file_url: '#', file_type: 'xlsx', uploaded_by: '鈴木 花子', uploaded_at: '2025-12-01', tags: ['テンプレート', '見積'] },
  { id: 'doc5', org_id: 'org1', title: '個人情報保護方針', category: 'manual', file_url: '#', file_type: 'pdf', uploaded_by: '山田 美咲', uploaded_at: '2025-11-15', tags: ['規則', 'プライバシー'] },
  { id: 'doc6', org_id: 'org1', title: '東京デジタル請求書_202601', category: 'invoice', file_url: '#', file_type: 'pdf', uploaded_by: '鈴木 花子', uploaded_at: '2026-01-05', tags: ['請求書', '東京デジタル'] },
  { id: 'doc7', org_id: 'org1', title: '営業マニュアル v3.0', category: 'manual', file_url: '#', file_type: 'pdf', uploaded_by: '田中 太郎', uploaded_at: '2026-02-10', tags: ['営業', 'マニュアル'] },
  { id: 'doc8', org_id: 'org1', title: '経費精算フォーム', category: 'template', file_url: '#', file_type: 'xlsx', uploaded_by: '鈴木 花子', uploaded_at: '2025-10-01', tags: ['テンプレート', '経費'] },
]

// ── 備品 ──
export const mockEquipment: Equipment[] = [
  { id: 'eq1', org_id: 'org1', name: 'MacBook Pro 14"', category: 'PC', serial_number: 'MBP-2025-001', assigned_to: '高橋 翔太', status: 'in_use', purchase_date: '2025-04-01', purchase_price: 298000 },
  { id: 'eq2', org_id: 'org1', name: 'MacBook Pro 14"', category: 'PC', serial_number: 'MBP-2025-002', assigned_to: '渡辺 大輝', status: 'in_use', purchase_date: '2025-04-01', purchase_price: 298000 },
  { id: 'eq3', org_id: 'org1', name: 'Dell U2723QE モニター', category: 'モニター', serial_number: 'DELL-2025-001', assigned_to: '高橋 翔太', status: 'in_use', purchase_date: '2025-04-15', purchase_price: 75000 },
  { id: 'eq4', org_id: 'org1', name: 'iPhone 15 Pro', category: '携帯電話', serial_number: 'IP15-001', assigned_to: '田中 太郎', status: 'in_use', purchase_date: '2025-09-20', purchase_price: 159800 },
  { id: 'eq5', org_id: 'org1', name: 'Brother MFC-L3780CDW', category: '複合機', status: 'in_use', purchase_date: '2024-06-01', purchase_price: 65000 },
  { id: 'eq6', org_id: 'org1', name: 'ThinkPad X1 Carbon', category: 'PC', serial_number: 'TP-2024-003', status: 'available', purchase_date: '2024-04-01', purchase_price: 225000 },
  { id: 'eq7', org_id: 'org1', name: 'Logicool MX Keys', category: 'キーボード', serial_number: 'MXK-005', status: 'maintenance', purchase_date: '2025-01-15', purchase_price: 16500 },
]

// ── オフィスリクエスト ──
export const mockOfficeRequests: OfficeRequest[] = [
  { id: 'or1', org_id: 'org1', requested_by: '渡辺 大輝', type: 'it_support', title: 'VPN接続エラー', description: 'リモートワーク時にVPN接続が不安定。再設定を依頼したい。', status: 'in_progress', priority: 'high', created_at: '2026-02-20' },
  { id: 'or2', org_id: 'org1', requested_by: '山田 美咲', type: 'supply', title: 'コピー用紙補充', description: 'A4コピー用紙 10箱 発注依頼', status: 'pending', priority: 'low', created_at: '2026-02-21' },
  { id: 'or3', org_id: 'org1', requested_by: '鈴木 花子', type: 'maintenance', title: '会議室Bの空調不良', description: '暖房が効かない。修理業者手配をお願いします。', status: 'pending', priority: 'medium', created_at: '2026-02-19' },
  { id: 'or4', org_id: 'org1', requested_by: '田中 太郎', type: 'it_support', title: 'Slack連携設定', description: '新しいSlackチャンネルとの連携設定依頼', status: 'completed', priority: 'low', created_at: '2026-02-15', resolved_at: '2026-02-16' },
  { id: 'or5', org_id: 'org1', requested_by: '伊藤 愛', type: 'supply', title: '名刺追加発注', description: '名刺500枚の追加発注。デザインは現行のまま。', status: 'completed', priority: 'medium', created_at: '2026-02-10', resolved_at: '2026-02-14' },
]

// ── AI操作ログ ──
export const mockAuditLogs: AuditLogEntry[] = [
  { id: 'log1', org_id: 'org1', user_name: '田中 太郎', domain: 'crm', intent: '商談ステージ更新', action: 'deals.update_stage', detail: 'サクラテック案件をnegotiation→wonに変更', success: true, timestamp: '2026-02-20 15:30:00' },
  { id: 'log2', org_id: 'org1', user_name: '鈴木 花子', domain: 'accounting', intent: '経費承認', action: 'expenses.approve', detail: '田中太郎の交通費 ¥27,500 を承認', success: true, timestamp: '2026-02-20 14:15:00' },
  { id: 'log3', org_id: 'org1', user_name: '佐藤 健一', domain: 'crm', intent: 'テレアポ結果記録', action: 'teleapo.record_result', detail: 'アクセル合同会社へのテレアポ結果を記録', success: true, timestamp: '2026-02-21 10:30:00' },
  { id: 'log4', org_id: 'org1', user_name: '山田 美咲', domain: 'hr', intent: '有給申請', action: 'leave.request', detail: '伊藤愛の2/20有給申請を処理', success: true, timestamp: '2026-02-19 09:00:00' },
  { id: 'log5', org_id: 'org1', user_name: '高橋 翔太', domain: 'general', intent: '備品登録', action: 'equipment.register', detail: '新規モニター購入の登録を試みたが在庫番号重複エラー', success: false, timestamp: '2026-02-21 11:00:00' },
  { id: 'log6', org_id: 'org1', user_name: '鈴木 花子', domain: 'accounting', intent: '請求書発行', action: 'invoices.create', detail: 'ミライソリューション向け請求書 INV-2026-0046 を作成', success: true, timestamp: '2026-02-20 16:00:00' },
  { id: 'log7', org_id: 'org1', user_name: '田中 太郎', domain: 'documents', intent: '契約書アップロード', action: 'documents.upload', detail: 'サクラテック業務委託契約書をアップロード', success: true, timestamp: '2026-02-20 13:00:00' },
  { id: 'log8', org_id: 'org1', user_name: '伊藤 愛', domain: 'crm', intent: 'テレアポ実行', action: 'teleapo.execute_call', detail: 'ブルースカイへの架電を実行（不在）', success: true, timestamp: '2026-02-21 14:05:00' },
  { id: 'log9', org_id: 'org1', user_name: '渡辺 大輝', domain: 'general', intent: 'ITサポート依頼', action: 'requests.create', detail: 'VPN接続エラーのサポート依頼を作成', success: true, timestamp: '2026-02-20 17:30:00' },
  { id: 'log10', org_id: 'org1', user_name: '鈴木 花子', domain: 'accounting', intent: '経費却下', action: 'expenses.reject', detail: '田中太郎のタクシー代 ¥4,800 を却下（領収書不備）', success: true, timestamp: '2026-02-18 10:00:00' },
]

// ── KPIスパークラインデータ ──
export const mockRevenueSparkline: SparklinePoint[] = [
  { value: 10800000 }, { value: 11500000 }, { value: 12200000 }, { value: 13000000 },
  { value: 11900000 }, { value: 10500000 }, { value: 12500000 }, { value: 14200000 },
  { value: 11800000 }, { value: 16500000 }, { value: 13800000 }, { value: 15200000 },
]

export const mockProfitSparkline: SparklinePoint[] = [
  { value: 2300000 }, { value: 2600000 }, { value: 2900000 }, { value: 3300000 },
  { value: 2700000 }, { value: 2200000 }, { value: 3000000 }, { value: 3800000 },
  { value: 2500000 }, { value: 5100000 }, { value: 3400000 }, { value: 4400000 },
]

export const mockCashSparkline: SparklinePoint[] = [
  { value: 8200000 }, { value: 8800000 }, { value: 9500000 }, { value: 10200000 },
  { value: 9800000 }, { value: 9200000 }, { value: 10100000 }, { value: 11300000 },
  { value: 10800000 }, { value: 12800000 }, { value: 12000000 }, { value: 12500000 },
]

// ── キャッシュフロー予測（3ヶ月先） ──
export const mockCashFlowForecast: CashFlowForecast[] = [
  { month: '3月', inflow: 16800000, outflow: 12200000, net: 4600000 },
  { month: '4月', inflow: 14500000, outflow: 11800000, net: 2700000 },
  { month: '5月', inflow: 17200000, outflow: 13000000, net: 4200000 },
]

// ── 経費カテゴリ別内訳 ──
export const mockExpenseCategories: ExpenseCategory[] = [
  { name: '人件費', value: 45, percentage: 45, color: '#2563eb' },
  { name: '外注費', value: 20, percentage: 20, color: '#7c3aed' },
  { name: '交通費', value: 12, percentage: 12, color: '#16a34a' },
  { name: '通信費', value: 8, percentage: 8, color: '#f59e0b' },
  { name: 'その他', value: 15, percentage: 15, color: '#6b7280' },
]

// ── 売掛金エージング ──
export const mockReceivableAging: ReceivableAging[] = [
  { category: '未到来', amount: 4500000, color: '#2563eb' },
  { category: '30日以内', amount: 2200000, color: '#16a34a' },
  { category: '60日以内', amount: 1230000, color: '#f59e0b' },
  { category: '90日超', amount: 800000, color: '#dc2626' },
]

// ── 商談パイプラインファネル ──
export const mockPipelineFunnel: PipelineFunnel[] = [
  { stage: 'lead', label: 'リード', amount: 8200000, count: 12, conversionRate: undefined },
  { stage: 'proposal', label: '提案', amount: 9200000, count: 8, conversionRate: 67 },
  { stage: 'negotiation', label: '交渉', amount: 10000000, count: 5, conversionRate: 63 },
  { stage: 'won', label: '成約', amount: 3500000, count: 3, conversionRate: 60 },
]

// ── 承認待ちタスク ──
export const mockPendingApprovals: PendingApproval[] = [
  { id: 'pa1', avatar: '佐', name: '佐藤 健一', description: '接待交際費 - 顧客会食（ミライソリューション）', amount: 35000, timeAgo: '2時間前', type: 'expense' },
  { id: 'pa2', avatar: '高', name: '高橋 翔太', description: 'AWS利用料（2月分）', amount: 125000, timeAgo: '5時間前', type: 'expense' },
  { id: 'pa3', avatar: '渡', name: '渡辺 大輝', description: '外部モニター購入', amount: 45000, timeAgo: '1日前', type: 'purchase' },
  { id: 'pa4', avatar: '伊', name: '伊藤 愛', description: '有給休暇申請（3/5-3/7）', amount: 0, timeAgo: '1日前', type: 'leave' },
  { id: 'pa5', avatar: '田', name: '田中 太郎', description: 'サクラテック追加業務委託契約書', amount: 1500000, timeAgo: '2日前', type: 'contract' },
]

// ── ダッシュボード用AI操作ログ（タイムライン） ──
export const mockDashboardAuditLogs: DashboardAuditLog[] = [
  { id: 'dl1', icon: 'handshake', domain: 'crm', userName: '田中 太郎', action: 'サクラテック案件を成約に変更', timestamp: '15:30' },
  { id: 'dl2', icon: 'calculator', domain: 'accounting', userName: '鈴木 花子', action: '田中太郎の交通費を承認', timestamp: '14:15' },
  { id: 'dl3', icon: 'phone', domain: 'crm', userName: '佐藤 健一', action: 'アクセル合同会社テレアポ結果記録', timestamp: '10:30' },
  { id: 'dl4', icon: 'users', domain: 'hr', userName: '山田 美咲', action: '伊藤愛の有給申請を処理', timestamp: '09:00' },
  { id: 'dl5', icon: 'alert', domain: 'general', userName: '高橋 翔太', action: '備品登録エラー（在庫番号重複）', timestamp: '11:00' },
  { id: 'dl6', icon: 'file', domain: 'accounting', userName: '鈴木 花子', action: 'ミライソリューション請求書作成', timestamp: '16:00' },
  { id: 'dl7', icon: 'upload', domain: 'documents', userName: '田中 太郎', action: 'サクラテック契約書アップロード', timestamp: '13:00' },
]

// ══════════════════════════════════════════
// 経理・会計ページ 追加データ
// ══════════════════════════════════════════

// ── 入金・出金スケジュール（30日分） ──
export const mockPaymentSchedule: PaymentScheduleItem[] = [
  { id: 'ps1', date: '2026-02-25', companyName: '株式会社ABC商事', amount: 3080000, type: 'income', description: '請求書 INV-2026-0044 入金' },
  { id: 'ps2', date: '2026-02-26', companyName: 'AWS Japan', amount: 125000, type: 'expense', description: 'クラウドインフラ利用料' },
  { id: 'ps3', date: '2026-02-28', companyName: '株式会社サクラテック', amount: 1500000, type: 'income', description: '追加開発案件 前受金' },
  { id: 'ps4', date: '2026-03-01', companyName: '東京電力エナジーパートナー', amount: 85000, type: 'expense', description: 'オフィス電気代' },
  { id: 'ps5', date: '2026-03-03', companyName: 'WeWork Japan', amount: 680000, type: 'expense', description: 'オフィス賃料' },
  { id: 'ps6', date: '2026-03-05', companyName: '合同会社ミライソリューション', amount: 1045000, type: 'income', description: 'DX推進支援 着手金' },
  { id: 'ps7', date: '2026-03-10', companyName: 'NTTコミュニケーションズ', amount: 45000, type: 'expense', description: '通信回線費' },
  { id: 'ps8', date: '2026-03-15', companyName: '東京デジタル株式会社', amount: 4250000, type: 'income', description: 'クラウド移行PJ 中間金' },
  { id: 'ps9', date: '2026-03-20', companyName: '社会保険事務所', amount: 1200000, type: 'expense', description: '社会保険料' },
  { id: 'ps10', date: '2026-03-25', companyName: '従業員給与', amount: 4800000, type: 'expense', description: '2026年3月分給与' },
]

// ── 未収金一覧（Accounts Receivable） ──
export const mockAccountsReceivable: AccountsReceivableItem[] = [
  { id: 'ar1', invoiceNumber: 'INV-2026-0043', clientName: '日本テクノ株式会社', amount: 1650000, dueDate: '2026-02-14', daysPastDue: 9, status: 'overdue' },
  { id: 'ar2', invoiceNumber: 'INV-2026-0044', clientName: '株式会社ABC商事', amount: 3080000, dueDate: '2026-02-28', daysPastDue: 0, status: 'current' },
  { id: 'ar3', invoiceNumber: 'INV-2025-0039', clientName: '大阪商事株式会社', amount: 2200000, dueDate: '2026-01-31', daysPastDue: 23, status: 'critical' },
  { id: 'ar4', invoiceNumber: 'INV-2026-0046', clientName: '合同会社ミライソリューション', amount: 1045000, dueDate: '2026-03-20', daysPastDue: 0, status: 'current' },
  { id: 'ar5', invoiceNumber: 'INV-2026-0041', clientName: '株式会社グローバルコネクト', amount: 880000, dueDate: '2026-02-10', daysPastDue: 13, status: 'overdue' },
  { id: 'ar6', invoiceNumber: 'INV-2026-0047', clientName: '株式会社サクラテック', amount: 1500000, dueDate: '2026-03-15', daysPastDue: 0, status: 'current' },
]

// ── 最近の仕訳 ──
export const mockJournalEntries: JournalEntry[] = [
  { id: 'je1', date: '2026-02-20', description: 'サクラテック 売上計上', debit: 3850000, credit: 0, account: '売掛金' },
  { id: 'je2', date: '2026-02-20', description: 'サクラテック 売上計上', debit: 0, credit: 3850000, account: '売上高' },
  { id: 'je3', date: '2026-02-19', description: '交通費精算（田中）', debit: 27500, credit: 0, account: '旅費交通費' },
  { id: 'je4', date: '2026-02-19', description: '交通費精算（田中）', debit: 0, credit: 27500, account: '現金' },
  { id: 'je5', date: '2026-02-18', description: 'AWS利用料計上', debit: 125000, credit: 0, account: '通信費' },
  { id: 'je6', date: '2026-02-18', description: 'AWS利用料計上', debit: 0, credit: 125000, account: '未払金' },
  { id: 'je7', date: '2026-02-15', description: '東京デジタル入金', debit: 4620000, credit: 0, account: '普通預金' },
  { id: 'je8', date: '2026-02-15', description: '東京デジタル入金', debit: 0, credit: 4620000, account: '売掛金' },
]

// ── 経費内訳（ドーナツチャート用） ──
export const mockExpenseCategoryDonut: ExpenseCategoryDonut[] = [
  { name: '人件費', value: 4800000, color: '#2563eb' },
  { name: '外注費', value: 2100000, color: '#7c3aed' },
  { name: '地代家賃', value: 680000, color: '#0891b2' },
  { name: '旅費交通費', value: 320000, color: '#16a34a' },
  { name: '通信費', value: 250000, color: '#f59e0b' },
  { name: 'その他', value: 650000, color: '#6b7280' },
]

// ══════════════════════════════════════════
// 人事・労務ページ 追加データ
// ══════════════════════════════════════════

// ── 月次残業推移（12ヶ月） ──
export const mockMonthlyOvertime: MonthlyOvertime[] = [
  { month: '3月', average: 22.5, max: 38.0 },
  { month: '4月', average: 25.0, max: 42.0 },
  { month: '5月', average: 18.0, max: 35.0 },
  { month: '6月', average: 20.5, max: 37.0 },
  { month: '7月', average: 24.0, max: 41.0 },
  { month: '8月', average: 15.0, max: 30.0 },
  { month: '9月', average: 21.0, max: 36.0 },
  { month: '10月', average: 23.5, max: 40.0 },
  { month: '11月', average: 19.0, max: 34.0 },
  { month: '12月', average: 28.0, max: 48.0 },
  { month: '1月', average: 20.0, max: 39.0 },
  { month: '2月', average: 18.2, max: 42.5 },
]

// ── 部署別残業分布 ──
export const mockDepartmentOvertime: DepartmentOvertime[] = [
  {
    department: '開発部',
    employees: [
      { name: '高橋 翔太', hours: 42.5 },
      { name: '渡辺 大輝', hours: 35.5 },
    ],
  },
  {
    department: '営業部',
    employees: [
      { name: '田中 太郎', hours: 38.0 },
      { name: '佐藤 健一', hours: 28.0 },
      { name: '伊藤 愛', hours: 5.0 },
    ],
  },
  {
    department: '人事部',
    employees: [
      { name: '山田 美咲', hours: 12.5 },
    ],
  },
  {
    department: '経理部',
    employees: [
      { name: '鈴木 花子', hours: 8.0 },
    ],
  },
]

// ── 勤怠サマリー（月間） ──
export const mockMonthlyAttendanceSummary: MonthlyAttendanceSummary[] = [
  { employeeId: 'e1', employeeName: '田中 太郎', department: '営業部', workDays: 15, totalOvertime: 38.0, lateCount: 0, absenceCount: 0 },
  { employeeId: 'e2', employeeName: '鈴木 花子', department: '経理部', workDays: 15, totalOvertime: 8.0, lateCount: 0, absenceCount: 0 },
  { employeeId: 'e3', employeeName: '佐藤 健一', department: '営業部', workDays: 14, totalOvertime: 28.0, lateCount: 3, absenceCount: 0 },
  { employeeId: 'e4', employeeName: '山田 美咲', department: '人事部', workDays: 15, totalOvertime: 12.5, lateCount: 0, absenceCount: 0 },
  { employeeId: 'e5', employeeName: '高橋 翔太', department: '開発部', workDays: 15, totalOvertime: 42.5, lateCount: 0, absenceCount: 0 },
  { employeeId: 'e6', employeeName: '伊藤 愛', department: '営業部', workDays: 13, totalOvertime: 5.0, lateCount: 0, absenceCount: 0 },
  { employeeId: 'e7', employeeName: '渡辺 大輝', department: '開発部', workDays: 15, totalOvertime: 35.5, lateCount: 0, absenceCount: 0 },
  { employeeId: 'e8', employeeName: '中村 さくら', department: '総務部', workDays: 0, totalOvertime: 0, lateCount: 0, absenceCount: 15 },
]

// ══════════════════════════════════════════
// CRM ページ追加データ
// ══════════════════════════════════════════

// ── 売上予測（4ヶ月） ──
export const mockSalesForecast: SalesForecast[] = [
  { month: '2月', actual: 3500000, target: 5000000, forecast: 3500000 },
  { month: '3月', actual: 0, target: 6000000, forecast: 5800000 },
  { month: '4月', actual: 0, target: 5500000, forecast: 4900000 },
  { month: '5月', actual: 0, target: 7000000, forecast: 6200000 },
]

// ── テレアポ日次実績 ──
export const mockTeleapoDailyStats: TeleapoDailyStats = {
  totalCalls: 18,
  connected: 12,
  appointments: 3,
  connectionRate: 66.7,
}

// ══════════════════════════════════════════
// Documents ページ追加データ
// ══════════════════════════════════════════

// ── ドキュメントテンプレート ──
export const mockDocTemplates: DocTemplate[] = [
  { id: 'tpl1', name: '業務委託契約書', category: 'contract', description: '標準業務委託契約テンプレート。NDA条項・検収基準含む。', usageCount: 24, variables: ['委託者名', '受託者名', '契約期間', '報酬額'], lastUsed: '2026-02-18' },
  { id: 'tpl2', name: '見積書テンプレート', category: 'invoice', description: '税込・税抜対応の見積書テンプレート。', usageCount: 45, variables: ['顧客名', '案件名', '金額', '有効期限'], lastUsed: '2026-02-21' },
  { id: 'tpl3', name: '月次レポート', category: 'report', description: 'KPI・実績・課題をまとめた月次報告テンプレート。', usageCount: 12, variables: ['対象月', '部署名', '目標値', '実績値'], lastUsed: '2026-02-20' },
  { id: 'tpl4', name: '秘密保持契約書（NDA）', category: 'contract', description: '双方向NDAテンプレート。英語版あり。', usageCount: 18, variables: ['甲', '乙', '秘密情報範囲', '有効期限'], lastUsed: '2026-02-15' },
  { id: 'tpl5', name: '請求書テンプレート', category: 'invoice', description: 'インボイス制度対応の請求書テンプレート。', usageCount: 56, variables: ['顧客名', '請求番号', '金額', '振込先'], lastUsed: '2026-02-22' },
  { id: 'tpl6', name: '営業提案書', category: 'report', description: '提案書ベーステンプレート。課題分析→提案→見積構成。', usageCount: 15, variables: ['顧客名', '課題', '提案内容', '概算費用'], lastUsed: '2026-02-19' },
  { id: 'tpl7', name: '社内マニュアル', category: 'manual', description: '業務手順書テンプレート。目次自動生成対応。', usageCount: 8, variables: ['マニュアル名', '対象部署', '作成者'], lastUsed: '2026-01-30' },
  { id: 'tpl8', name: '雇用契約書', category: 'contract', description: '正社員・契約社員対応の雇用契約テンプレート。', usageCount: 10, variables: ['社員名', '所属部署', '契約期間', '給与'], lastUsed: '2026-02-01' },
]

// ── ドキュメント拡張版 ──
export const mockDocumentsExtended: DocumentExtended[] = [
  { id: 'dex1', title: '就業規則（最新版）', category: 'manual', version: 'v3.2', createdBy: '山田 美咲', createdAt: '2026-01-10', contentPreview: '第1条（目的）本規則は、従業員の就業に関する事項を定めることを目的とする。', fileType: 'pdf' },
  { id: 'dex2', title: 'サクラテック業務委託契約書', category: 'contract', version: 'v1.0', createdBy: '田中 太郎', createdAt: '2026-02-01', contentPreview: '甲（委託者）：株式会社デモテック 乙（受託者）：株式会社サクラテック', fileType: 'pdf' },
  { id: 'dex3', title: '2026年2月度月次レポート', category: 'report', version: 'v1.1', createdBy: '鈴木 花子', createdAt: '2026-02-20', contentPreview: '2026年2月度売上実績: ¥15,200,000（前月比+10.1%）営業利益: ¥4,400,000', fileType: 'pdf' },
  { id: 'dex4', title: '個人情報保護方針', category: 'manual', version: 'v2.0', createdBy: '山田 美咲', createdAt: '2025-11-15', contentPreview: '当社は、個人情報の保護に関する法律に基づき、以下の方針を定めます。', fileType: 'pdf' },
  { id: 'dex5', title: '東京デジタル請求書_202601', category: 'invoice', version: 'v1.0', createdBy: '鈴木 花子', createdAt: '2026-01-05', contentPreview: '請求番号: INV-2026-0042 請求金額: ¥4,620,000（税込）', fileType: 'pdf' },
  { id: 'dex6', title: '営業マニュアル v3.0', category: 'manual', version: 'v3.0', createdBy: '田中 太郎', createdAt: '2026-02-10', contentPreview: '第1章: テレアポの基本フロー / 第2章: 提案資料作成のポイント', fileType: 'pdf' },
  { id: 'dex7', title: 'ミライソリューション見積書', category: 'invoice', version: 'v2.0', createdBy: '佐藤 健一', createdAt: '2026-02-18', contentPreview: 'DX推進支援パッケージ 見積金額: ¥5,000,000（税抜）', fileType: 'pdf' },
  { id: 'dex8', title: 'クラウド移行提案書', category: 'report', version: 'v1.0', createdBy: '高橋 翔太', createdAt: '2026-01-20', contentPreview: '現行オンプレミス環境からAWSへの移行計画。3フェーズ構成。', fileType: 'pdf' },
  { id: 'dex9', title: 'セキュリティポリシー', category: 'manual', version: 'v1.5', createdBy: '高橋 翔太', createdAt: '2025-12-20', contentPreview: '情報セキュリティ基本方針。ISMS認証取得に向けた社内規程。', fileType: 'pdf' },
  { id: 'dex10', title: 'ABC商事 業務委託契約書', category: 'contract', version: 'v1.1', createdBy: '田中 太郎', createdAt: '2026-02-05', contentPreview: '委託業務: AI導入コンサルティング 契約期間: 2026/3/1〜2026/8/31', fileType: 'pdf' },
  { id: 'dex11', title: 'グローバルコネクト NDA', category: 'contract', version: 'v1.0', createdBy: '伊藤 愛', createdAt: '2026-02-08', contentPreview: '秘密保持契約。秘密情報の定義、開示制限、契約期間を規定。', fileType: 'pdf' },
  { id: 'dex12', title: '経費精算規程', category: 'manual', version: 'v2.1', createdBy: '鈴木 花子', createdAt: '2026-01-15', contentPreview: '経費精算の対象範囲、申請フロー、承認基準について定める。', fileType: 'pdf' },
  { id: 'dex13', title: '2026年1月度月次レポート', category: 'report', version: 'v1.0', createdBy: '鈴木 花子', createdAt: '2026-02-05', contentPreview: '2026年1月度売上実績: ¥13,800,000 営業利益: ¥3,400,000', fileType: 'pdf' },
  { id: 'dex14', title: '大阪商事 見積書', category: 'invoice', version: 'v1.0', createdBy: '佐藤 健一', createdAt: '2026-02-12', contentPreview: '業務自動化ツール導入 見積金額: ¥4,200,000（税抜）', fileType: 'pdf' },
  { id: 'dex15', title: 'リモートワーク規程', category: 'manual', version: 'v1.0', createdBy: '山田 美咲', createdAt: '2026-01-20', contentPreview: 'テレワーク実施のガイドライン。対象者、申請方法、勤怠管理。', fileType: 'pdf' },
  { id: 'dex16', title: 'サクラテック追加開発見積書', category: 'invoice', version: 'v1.0', createdBy: '田中 太郎', createdAt: '2026-02-15', contentPreview: '追加開発案件 見積金額: ¥1,500,000（税抜）', fileType: 'pdf' },
]

// ══════════════════════════════════════════
// General ページ追加データ
// ══════════════════════════════════════════

// ── 備品拡張版 ──
export const mockEquipmentExtended: EquipmentExtended[] = [
  { id: 'eqx1', name: 'MacBook Pro 14"', category: 'PC', categoryIcon: 'laptop', location: '開発エリア', assignedTo: '高橋 翔太', status: 'in_use', registeredAt: '2025-04-01' },
  { id: 'eqx2', name: 'MacBook Pro 14"', category: 'PC', categoryIcon: 'laptop', location: '開発エリア', assignedTo: '渡辺 大輝', status: 'in_use', registeredAt: '2025-04-01' },
  { id: 'eqx3', name: 'Dell U2723QE モニター', category: 'モニター', categoryIcon: 'monitor', location: '開発エリア', assignedTo: '高橋 翔太', status: 'in_use', registeredAt: '2025-04-15' },
  { id: 'eqx4', name: 'iPhone 15 Pro', category: '携帯電話', categoryIcon: 'smartphone', location: '営業部', assignedTo: '田中 太郎', status: 'in_use', registeredAt: '2025-09-20' },
  { id: 'eqx5', name: 'Brother MFC-L3780CDW', category: '複合機', categoryIcon: 'printer', location: '共有エリア', assignedTo: '-', status: 'in_use', registeredAt: '2024-06-01' },
  { id: 'eqx6', name: 'ThinkPad X1 Carbon', category: 'PC', categoryIcon: 'laptop', location: '倉庫', assignedTo: '-', status: 'available', registeredAt: '2024-04-01' },
  { id: 'eqx7', name: 'Logicool MX Keys', category: 'キーボード', categoryIcon: 'keyboard', location: 'IT管理室', assignedTo: '-', status: 'maintenance', registeredAt: '2025-01-15' },
  { id: 'eqx8', name: 'Dell U2422H モニター', category: 'モニター', categoryIcon: 'monitor', location: '営業部', assignedTo: '佐藤 健一', status: 'in_use', registeredAt: '2025-03-01' },
  { id: 'eqx9', name: 'HP LaserJet Pro', category: '複合機', categoryIcon: 'printer', location: '3F会議室', assignedTo: '-', status: 'maintenance', registeredAt: '2024-01-15' },
  { id: 'eqx10', name: 'iPad Air', category: 'タブレット', categoryIcon: 'tablet', location: '営業部', assignedTo: '伊藤 愛', status: 'in_use', registeredAt: '2025-06-01' },
  { id: 'eqx11', name: 'ThinkPad T14s', category: 'PC', categoryIcon: 'laptop', location: '経理部', assignedTo: '鈴木 花子', status: 'in_use', registeredAt: '2025-02-01' },
  { id: 'eqx12', name: 'ASUS ProArt モニター', category: 'モニター', categoryIcon: 'monitor', location: '開発エリア', assignedTo: '渡辺 大輝', status: 'in_use', registeredAt: '2025-07-01' },
  { id: 'eqx13', name: 'Logicool MX Master 3S', category: 'マウス', categoryIcon: 'mouse', location: '人事部', assignedTo: '山田 美咲', status: 'in_use', registeredAt: '2025-04-01' },
  { id: 'eqx14', name: 'Cisco Webex Board', category: '会議機器', categoryIcon: 'monitor', location: '大会議室', assignedTo: '-', status: 'in_use', registeredAt: '2024-10-01' },
  { id: 'eqx15', name: 'AirPods Pro', category: 'イヤホン', categoryIcon: 'headphones', location: '営業部', assignedTo: '田中 太郎', status: 'in_use', registeredAt: '2025-08-01' },
  { id: 'eqx16', name: 'Surface Pro 9', category: 'PC', categoryIcon: 'laptop', location: '総務部', assignedTo: '中村 さくら', status: 'in_use', registeredAt: '2025-05-01' },
  { id: 'eqx17', name: 'Canon プロジェクター', category: 'プロジェクター', categoryIcon: 'projector', location: '小会議室', assignedTo: '-', status: 'available', registeredAt: '2023-12-01' },
  { id: 'eqx18', name: 'Poly Studio P15', category: 'Webカメラ', categoryIcon: 'camera', location: '2F会議室', assignedTo: '-', status: 'in_use', registeredAt: '2025-01-01' },
  { id: 'eqx19', name: 'Logicool MX Keys Mini', category: 'キーボード', categoryIcon: 'keyboard', location: '倉庫', assignedTo: '-', status: 'available', registeredAt: '2025-03-15' },
  { id: 'eqx20', name: 'Dell OptiPlex', category: 'PC', categoryIcon: 'desktop', location: '受付', assignedTo: '-', status: 'disposed', registeredAt: '2022-04-01' },
]

// ══════════════════════════════════════════
// AuditLog ページ追加データ
// ══════════════════════════════════════════

// ── 監査ログ拡張版 ──
export const mockAuditLogsExtended: AuditLogExtended[] = [
  { id: 'ale1', timestamp: '2026-02-23 09:15:00', userName: '田中 太郎', userAvatar: '田', domain: 'crm', action: 'テレアポ実行', detail: '株式会社ネクストワンへの架電を実行', success: true, processingTime: 1200, requestPayload: '{"target":"株式会社ネクストワン","phone":"03-6789-0123"}', responsePayload: '{"status":"connected","duration":"3m15s"}' },
  { id: 'ale2', timestamp: '2026-02-23 09:30:00', userName: '鈴木 花子', userAvatar: '鈴', domain: 'accounting', action: '請求書自動生成', detail: 'ミライソリューション向け請求書を自動生成', success: true, processingTime: 3400, requestPayload: '{"client":"合同会社ミライソリューション","amount":1045000}', responsePayload: '{"invoiceNumber":"INV-2026-0046","status":"draft"}' },
  { id: 'ale3', timestamp: '2026-02-23 10:00:00', userName: '佐藤 健一', userAvatar: '佐', domain: 'crm', action: '商談ステージ更新', detail: '大阪商事 業務自動化案件をリード→提案に変更', success: true, processingTime: 450, requestPayload: '{"dealId":"d5","from":"lead","to":"proposal"}', responsePayload: '{"updated":true}' },
  { id: 'ale4', timestamp: '2026-02-23 10:15:00', userName: '山田 美咲', userAvatar: '山', domain: 'hr', action: '勤怠データ集計', detail: '2月度の全社員勤怠データを自動集計', success: true, processingTime: 8900, requestPayload: '{"month":"2026-02","scope":"all"}', responsePayload: '{"processed":8,"totalWorkDays":102}' },
  { id: 'ale5', timestamp: '2026-02-23 10:30:00', userName: '高橋 翔太', userAvatar: '高', domain: 'general', action: '備品登録', detail: '新規モニター（Dell U2422H）を登録', success: false, processingTime: 220, requestPayload: '{"name":"Dell U2422H","serial":"DELL-2025-002"}', responsePayload: '{"error":"duplicate_serial","message":"シリアル番号が重複しています"}' },
  { id: 'ale6', timestamp: '2026-02-23 11:00:00', userName: '伊藤 愛', userAvatar: '伊', domain: 'crm', action: 'テレアポ結果記録', detail: 'エムテック株式会社へのテレアポ結果を記録（アポ獲得）', success: true, processingTime: 380, requestPayload: '{"company":"エムテック株式会社","result":"appointment"}', responsePayload: '{"recorded":true,"nextAction":"3/1 訪問予定"}' },
  { id: 'ale7', timestamp: '2026-02-23 11:30:00', userName: '渡辺 大輝', userAvatar: '渡', domain: 'documents', action: 'ドキュメント検索', detail: 'RAG検索: 「業務委託契約のテンプレート」', success: true, processingTime: 1800, requestPayload: '{"query":"業務委託契約のテンプレート","type":"rag_search"}', responsePayload: '{"results":3,"topMatch":"業務委託契約書 v1.0"}' },
  { id: 'ale8', timestamp: '2026-02-23 12:00:00', userName: '鈴木 花子', userAvatar: '鈴', domain: 'accounting', action: '経費自動分類', detail: '未分類経費5件をAIが自動分類', success: true, processingTime: 2100, requestPayload: '{"count":5,"type":"auto_classify"}', responsePayload: '{"classified":5,"categories":["交通費","通信費","消耗品費"]}' },
  { id: 'ale9', timestamp: '2026-02-23 13:00:00', userName: '田中 太郎', userAvatar: '田', domain: 'documents', action: '契約書アップロード', detail: 'ABC商事業務委託契約書をアップロード', success: true, processingTime: 5500, requestPayload: '{"filename":"ABC商事_業務委託契約書.pdf","size":"2.4MB"}', responsePayload: '{"docId":"dex10","indexed":true}' },
  { id: 'ale10', timestamp: '2026-02-23 13:30:00', userName: '佐藤 健一', userAvatar: '佐', domain: 'crm', action: '見積書生成', detail: '大阪商事向け見積書をAI生成', success: true, processingTime: 4200, requestPayload: '{"client":"大阪商事株式会社","items":["業務自動化ツール","導入支援"]}', responsePayload: '{"docId":"dex14","amount":4200000}' },
  { id: 'ale11', timestamp: '2026-02-23 14:00:00', userName: '山田 美咲', userAvatar: '山', domain: 'hr', action: '有給残高通知', detail: '有給残日数5日以下の社員にリマインド送信', success: true, processingTime: 1500, requestPayload: '{"threshold":5,"type":"reminder"}', responsePayload: '{"notified":["伊藤 愛","中村 さくら"]}' },
  { id: 'ale12', timestamp: '2026-02-23 14:30:00', userName: '高橋 翔太', userAvatar: '高', domain: 'general', action: 'IT機器棚卸', detail: '開発エリアのIT機器棚卸チェックリスト生成', success: true, processingTime: 3200, requestPayload: '{"area":"開発エリア","type":"inventory_check"}', responsePayload: '{"total":6,"verified":6,"missing":0}' },
  { id: 'ale13', timestamp: '2026-02-23 15:00:00', userName: '伊藤 愛', userAvatar: '伊', domain: 'crm', action: 'リード自動スコアリング', detail: 'Web経由の新規リード3件をAIスコアリング', success: true, processingTime: 2800, requestPayload: '{"leads":3,"source":"web"}', responsePayload: '{"scored":3,"highPriority":1}' },
  { id: 'ale14', timestamp: '2026-02-23 15:30:00', userName: '鈴木 花子', userAvatar: '鈴', domain: 'accounting', action: '月次レポート生成', detail: '2月度損益計算書の自動生成', success: true, processingTime: 7600, requestPayload: '{"month":"2026-02","type":"pl_report"}', responsePayload: '{"revenue":15200000,"operatingIncome":4400000}' },
  { id: 'ale15', timestamp: '2026-02-23 16:00:00', userName: '渡辺 大輝', userAvatar: '渡', domain: 'general', action: 'サポートチケット作成', detail: 'VPN接続エラーのサポートチケットを自動作成', success: true, processingTime: 600, requestPayload: '{"type":"it_support","priority":"high"}', responsePayload: '{"ticketId":"or1","assignedTo":"IT部門"}' },
  { id: 'ale16', timestamp: '2026-02-22 09:00:00', userName: '田中 太郎', userAvatar: '田', domain: 'crm', action: '商談ステージ更新', detail: 'サクラテック AI導入案件を交渉中→成約に変更', success: true, processingTime: 520, requestPayload: '{"dealId":"d1","from":"negotiation","to":"won"}', responsePayload: '{"updated":true,"amount":3500000}' },
  { id: 'ale17', timestamp: '2026-02-22 10:00:00', userName: '鈴木 花子', userAvatar: '鈴', domain: 'accounting', action: '入金消込', detail: '東京デジタル ¥4,620,000 の入金を自動消込', success: true, processingTime: 1100, requestPayload: '{"invoice":"INV-2026-0042","amount":4620000}', responsePayload: '{"matched":true,"remainingAR":0}' },
  { id: 'ale18', timestamp: '2026-02-22 11:00:00', userName: '佐藤 健一', userAvatar: '佐', domain: 'crm', action: 'テレアポ実行', detail: 'ライトハウス株式会社への架電（折返し希望）', success: true, processingTime: 950, requestPayload: '{"company":"ライトハウス株式会社","phone":"03-2345-6789"}', responsePayload: '{"status":"callback","note":"来週改めて電話希望"}' },
  { id: 'ale19', timestamp: '2026-02-22 14:00:00', userName: '山田 美咲', userAvatar: '山', domain: 'hr', action: '有給申請処理', detail: '伊藤愛の有給申請（2/20）を自動承認', success: true, processingTime: 400, requestPayload: '{"employee":"伊藤 愛","date":"2026-02-20","type":"paid_leave"}', responsePayload: '{"approved":true,"remainingDays":5}' },
  { id: 'ale20', timestamp: '2026-02-22 15:00:00', userName: '高橋 翔太', userAvatar: '高', domain: 'documents', action: 'マニュアル更新', detail: 'セキュリティポリシー v1.5 を自動更新', success: true, processingTime: 6200, requestPayload: '{"docId":"dex9","from":"v1.4","to":"v1.5"}', responsePayload: '{"updated":true,"changedSections":["3.2","4.1"]}' },
  { id: 'ale21', timestamp: '2026-02-21 09:30:00', userName: '伊藤 愛', userAvatar: '伊', domain: 'crm', action: 'テレアポ実行', detail: 'アクセル合同会社への架電（アポ獲得）', success: true, processingTime: 1100, requestPayload: '{"company":"アクセル合同会社","phone":"03-0123-4567"}', responsePayload: '{"status":"appointment","date":"2026-03-05"}' },
  { id: 'ale22', timestamp: '2026-02-21 11:00:00', userName: '鈴木 花子', userAvatar: '鈴', domain: 'accounting', action: '経費承認', detail: '田中太郎の交通費 ¥27,500 を自動承認', success: true, processingTime: 350, requestPayload: '{"expenseId":"exp1","amount":27500}', responsePayload: '{"approved":true}' },
  { id: 'ale23', timestamp: '2026-02-21 14:00:00', userName: '佐藤 健一', userAvatar: '佐', domain: 'crm', action: 'テレアポ実行', detail: '株式会社ブルースカイへの架電（不在）', success: true, processingTime: 800, requestPayload: '{"company":"株式会社ブルースカイ","phone":"06-1234-5678"}', responsePayload: '{"status":"no_answer","retryScheduled":"2026-02-24"}' },
]
