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
