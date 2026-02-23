import { Layout } from '../components/Layout'
import { StatusBadge } from '../components/StatusBadge'
import {
  mockDeals,
  mockInteractions,
  mockTeleapoSchedule,
  mockContacts,
} from '../lib/mockData'

const formatYen = (v: number) => `\u00a5${v.toLocaleString()}`

const stages = [
  { key: 'lead', label: 'リード', color: 'border-gray-300 bg-gray-50' },
  { key: 'proposal', label: '提案', color: 'border-blue-300 bg-blue-50' },
  { key: 'negotiation', label: '交渉中', color: 'border-purple-300 bg-purple-50' },
  { key: 'won', label: '成約', color: 'border-green-300 bg-green-50' },
  { key: 'lost', label: '失注', color: 'border-red-300 bg-red-50' },
] as const

const interactionTypeLabels: Record<string, string> = {
  call: '電話',
  email: 'メール',
  meeting: '面談',
  line: 'LINE',
}

const teleapoStatusLabels: Record<string, string> = {
  scheduled: '予定',
  completed: '完了',
  no_answer: '不在',
  callback: '折返し',
}

export function CRM() {
  // 顧客別商談額ランキング
  const contactDealTotals = mockContacts.map((c) => {
    const total = mockDeals
      .filter((d) => d.contact_id === c.id && d.stage !== 'lost')
      .reduce((sum, d) => sum + d.amount, 0)
    return { ...c, totalDealAmount: total }
  }).sort((a, b) => b.totalDealAmount - a.totalDealAmount)

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">営業・CRM</h1>
          <p className="text-gray-500 mt-1">商談パイプライン・顧客対応・テレアポ管理</p>
        </div>

        {/* パイプラインカンバン */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">商談パイプライン</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {stages.map((stage) => {
              const deals = mockDeals.filter((d) => d.stage === stage.key)
              const total = deals.reduce((sum, d) => sum + d.amount, 0)
              return (
                <div key={stage.key} className={`rounded-lg border-2 ${stage.color} p-3`}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-sm text-gray-700">{stage.label}</h3>
                    <span className="text-xs text-gray-500 bg-white px-2 py-0.5 rounded-full">{deals.length}件</span>
                  </div>
                  <p className="text-xs text-gray-500 mb-3">合計: {formatYen(total)}</p>
                  <div className="space-y-2">
                    {deals.map((deal) => (
                      <div key={deal.id} className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
                        <p className="text-sm font-medium text-gray-900 truncate">{deal.title}</p>
                        <p className="text-xs text-gray-500 mt-1 truncate">{deal.company_name}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-sm font-bold text-gray-900">{formatYen(deal.amount)}</span>
                          <span className="text-xs text-gray-400">{deal.assigned_to.split(' ')[0]}</span>
                        </div>
                      </div>
                    ))}
                    {deals.length === 0 && (
                      <p className="text-xs text-gray-400 text-center py-4">案件なし</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 最近のやりとり */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">最近のやりとり</h2>
            <div className="space-y-3">
              {mockInteractions.map((interaction) => (
                <div key={interaction.id} className="py-3 border-b border-gray-100 last:border-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="inline-flex items-center px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                      {interactionTypeLabels[interaction.type]}
                    </span>
                    <span className="text-sm font-medium text-gray-900">{interaction.company_name}</span>
                    <span className="text-xs text-gray-400 ml-auto">{interaction.date}</span>
                  </div>
                  <p className="text-sm text-gray-600">{interaction.summary}</p>
                  <p className="text-xs text-gray-400 mt-1">担当: {interaction.created_by}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 顧客別商談額 */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">顧客別商談額TOP</h2>
            <div className="space-y-3">
              {contactDealTotals.filter((c) => c.totalDealAmount > 0).map((contact, i) => (
                <div key={contact.id} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
                  <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-sm font-bold shrink-0">
                    {i + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">{contact.company_name}</p>
                    <p className="text-xs text-gray-500">{contact.person_name}</p>
                  </div>
                  <p className="text-sm font-bold text-gray-900 shrink-0">{formatYen(contact.totalDealAmount)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* テレアポスケジュール */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">テレアポスケジュール</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-200">
                  <th className="pb-3 font-medium">予定日時</th>
                  <th className="pb-3 font-medium">企業名</th>
                  <th className="pb-3 font-medium">担当者名</th>
                  <th className="pb-3 font-medium">電話番号</th>
                  <th className="pb-3 font-medium">担当</th>
                  <th className="pb-3 font-medium text-center">ステータス</th>
                  <th className="pb-3 font-medium">結果</th>
                </tr>
              </thead>
              <tbody>
                {mockTeleapoSchedule.map((sched, i) => (
                  <tr key={sched.id} className={`border-b border-gray-100 ${i % 2 === 0 ? 'bg-gray-50/50' : ''}`}>
                    <td className="py-3 text-gray-900">{sched.scheduled_at}</td>
                    <td className="py-3 text-gray-900 font-medium">{sched.company_name}</td>
                    <td className="py-3 text-gray-600">{sched.contact_name}</td>
                    <td className="py-3 text-gray-600 font-mono text-xs">{sched.phone}</td>
                    <td className="py-3 text-gray-600">{sched.assigned_to}</td>
                    <td className="py-3 text-center">
                      <StatusBadge status={sched.status} label={teleapoStatusLabels[sched.status]} />
                    </td>
                    <td className="py-3 text-gray-600 text-sm">{sched.result ?? '-'}</td>
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
