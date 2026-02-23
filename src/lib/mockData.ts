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
  { month: '2025年9月', revenue: 12500000, cost_of_sales: 5000000, gross_profit: 7500000, operating_expenses: 4500000, operating_income: 3000000 },
  { month: '2025年10月', revenue: 14200000, cost_of_sales: 5600000, gross_profit: 8600000, operating_expenses: 4800000, operating_income: 3800000 },
  { month: '2025年11月', revenue: 11800000, cost_of_sales: 4700000, gross_profit: 7100000, operating_expenses: 4600000, operating_income: 2500000 },
  { month: '2025年12月', revenue: 16500000, cost_of_sales: 6200000, gross_profit: 10300000, operating_expenses: 5200000, operating_income: 5100000 },
  { month: '2026年1月', revenue: 13800000, cost_of_sales: 5500000, gross_profit: 8300000, operating_expenses: 4900000, operating_income: 3400000 },
  { month: '2026年2月', revenue: 15200000, cost_of_sales: 5800000, gross_profit: 9400000, operating_expenses: 5000000, operating_income: 4400000 },
]

// ── 月次売上（チャート用） ──
export const mockMonthlyRevenue: MonthlyRevenue[] = [
  { month: '9月', revenue: 12500000, expenses: 9500000 },
  { month: '10月', revenue: 14200000, expenses: 10400000 },
  { month: '11月', revenue: 11800000, expenses: 9300000 },
  { month: '12月', revenue: 16500000, expenses: 11400000 },
  { month: '1月', revenue: 13800000, expenses: 10400000 },
  { month: '2月', revenue: 15200000, expenses: 10800000 },
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
