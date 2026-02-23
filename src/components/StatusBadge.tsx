const statusStyles: Record<string, string> = {
  // 汎用
  pending: 'bg-yellow-100 text-yellow-800',
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',

  // 請求書
  draft: 'bg-gray-100 text-gray-600',
  sent: 'bg-blue-100 text-blue-800',
  paid: 'bg-green-100 text-green-800',
  overdue: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-500',

  // 経費
  approved: 'bg-green-100 text-green-800',

  // 勤怠
  normal: 'bg-green-100 text-green-800',
  late: 'bg-orange-100 text-orange-800',
  absent: 'bg-red-100 text-red-800',
  holiday: 'bg-purple-100 text-purple-800',
  paid_leave: 'bg-cyan-100 text-cyan-800',

  // 備品
  available: 'bg-green-100 text-green-800',
  in_use: 'bg-blue-100 text-blue-800',
  maintenance: 'bg-orange-100 text-orange-800',
  disposed: 'bg-gray-100 text-gray-500',

  // 商談ステージ
  lead: 'bg-gray-100 text-gray-700',
  proposal: 'bg-blue-100 text-blue-800',
  negotiation: 'bg-purple-100 text-purple-800',
  won: 'bg-green-100 text-green-800',
  lost: 'bg-red-100 text-red-800',

  // テレアポ
  scheduled: 'bg-blue-100 text-blue-800',
  no_answer: 'bg-orange-100 text-orange-800',
  callback: 'bg-yellow-100 text-yellow-800',

  // 優先度
  low: 'bg-gray-100 text-gray-600',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-red-100 text-red-800',

  // 成功・失敗
  success: 'bg-green-100 text-green-800',
  failure: 'bg-red-100 text-red-800',
}

const statusLabels: Record<string, string> = {
  pending: '未処理',
  in_progress: '対応中',
  completed: '完了',
  rejected: '却下',
  draft: '下書き',
  sent: '送信済',
  paid: '入金済',
  overdue: '期限超過',
  cancelled: 'キャンセル',
  approved: '承認済',
  normal: '正常',
  late: '遅刻',
  absent: '欠勤',
  holiday: '休日',
  paid_leave: '有給',
  available: '利用可能',
  in_use: '使用中',
  maintenance: 'メンテナンス',
  disposed: '廃棄',
  lead: 'リード',
  proposal: '提案',
  negotiation: '交渉中',
  won: '成約',
  lost: '失注',
  scheduled: '予定',
  no_answer: '不在',
  callback: '折返し',
  low: '低',
  medium: '中',
  high: '高',
  success: '成功',
  failure: '失敗',
  supply: '消耗品',
  it_support: 'ITサポート',
  other: 'その他',
  contract: '契約書',
  invoice: '請求書',
  report: 'レポート',
  manual: 'マニュアル',
  template: 'テンプレート',
}

interface StatusBadgeProps {
  status: string
  label?: string
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const style = statusStyles[status] ?? 'bg-gray-100 text-gray-600'
  const displayLabel = label ?? statusLabels[status] ?? status

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${style}`}>
      {displayLabel}
    </span>
  )
}
