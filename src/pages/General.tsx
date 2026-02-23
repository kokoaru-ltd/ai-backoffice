import { Layout } from '../components/Layout'
import { StatusBadge } from '../components/StatusBadge'
import { mockEquipment, mockOfficeRequests } from '../lib/mockData'

const formatYen = (v: number) => `\u00a5${v.toLocaleString()}`

const requestTypeLabels: Record<string, string> = {
  supply: '消耗品',
  maintenance: 'メンテナンス',
  it_support: 'ITサポート',
  other: 'その他',
}

export function General() {
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">総務</h1>
          <p className="text-gray-500 mt-1">備品管理・オフィスリクエスト</p>
        </div>

        {/* 備品一覧 */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">備品管理</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-200">
                  <th className="pb-3 font-medium">備品名</th>
                  <th className="pb-3 font-medium">カテゴリ</th>
                  <th className="pb-3 font-medium">シリアル番号</th>
                  <th className="pb-3 font-medium">使用者</th>
                  <th className="pb-3 font-medium text-right">購入金額</th>
                  <th className="pb-3 font-medium">購入日</th>
                  <th className="pb-3 font-medium text-center">ステータス</th>
                </tr>
              </thead>
              <tbody>
                {mockEquipment.map((eq, i) => (
                  <tr key={eq.id} className={`border-b border-gray-100 ${i % 2 === 0 ? 'bg-gray-50/50' : ''}`}>
                    <td className="py-3 text-gray-900 font-medium">{eq.name}</td>
                    <td className="py-3 text-gray-600">{eq.category}</td>
                    <td className="py-3 text-gray-500 font-mono text-xs">{eq.serial_number ?? '-'}</td>
                    <td className="py-3 text-gray-600">{eq.assigned_to ?? '-'}</td>
                    <td className="py-3 text-gray-900 text-right">{formatYen(eq.purchase_price)}</td>
                    <td className="py-3 text-gray-600">{eq.purchase_date}</td>
                    <td className="py-3 text-center"><StatusBadge status={eq.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* オフィスリクエスト */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">オフィスリクエスト</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-200">
                  <th className="pb-3 font-medium">タイトル</th>
                  <th className="pb-3 font-medium">種別</th>
                  <th className="pb-3 font-medium">申請者</th>
                  <th className="pb-3 font-medium text-center">優先度</th>
                  <th className="pb-3 font-medium text-center">ステータス</th>
                  <th className="pb-3 font-medium">申請日</th>
                  <th className="pb-3 font-medium">完了日</th>
                </tr>
              </thead>
              <tbody>
                {mockOfficeRequests.map((req, i) => (
                  <tr key={req.id} className={`border-b border-gray-100 ${i % 2 === 0 ? 'bg-gray-50/50' : ''}`}>
                    <td className="py-3">
                      <div>
                        <p className="text-gray-900 font-medium">{req.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{req.description}</p>
                      </div>
                    </td>
                    <td className="py-3 text-gray-600">{requestTypeLabels[req.type]}</td>
                    <td className="py-3 text-gray-600">{req.requested_by}</td>
                    <td className="py-3 text-center"><StatusBadge status={req.priority} /></td>
                    <td className="py-3 text-center"><StatusBadge status={req.status} /></td>
                    <td className="py-3 text-gray-600">{req.created_at}</td>
                    <td className="py-3 text-gray-600">{req.resolved_at ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  )
}
