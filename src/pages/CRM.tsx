import { useState } from 'react'
import {
  Phone,
  Mail,
  Users as UsersIcon,
  FileEdit,
  TrendingUp,
  ArrowRight,
  Calendar,
  Clock,
  Target,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { Layout } from '../components/Layout'
import { StatusBadge } from '../components/StatusBadge'
import {
  mockDeals,
  mockInteractions,
  mockTeleapoSchedule,
  mockContacts,
  mockSalesForecast,
  mockTeleapoDailyStats,
} from '../lib/mockData'

const formatYen = (v: number) => `\u00a5${v.toLocaleString()}`
const formatYenShort = (v: number) => {
  if (v >= 10000000) return `\u00a5${(v / 10000000).toFixed(1)}千万`
  if (v >= 1000000) return `\u00a5${(v / 1000000).toFixed(1)}M`
  return formatYen(v)
}

const stages = [
  { key: 'lead', label: 'リード', color: '#6b7280', bgColor: 'bg-gray-50', borderColor: 'border-l-gray-400' },
  { key: 'proposal', label: '提案', color: '#3b82f6', bgColor: 'bg-blue-50', borderColor: 'border-l-blue-500' },
  { key: 'negotiation', label: '交渉中', color: '#8b5cf6', bgColor: 'bg-purple-50', borderColor: 'border-l-purple-500' },
  { key: 'won', label: '成約', color: '#22c55e', bgColor: 'bg-green-50', borderColor: 'border-l-green-500' },
  { key: 'lost', label: '失注', color: '#ef4444', bgColor: 'bg-red-50', borderColor: 'border-l-red-500' },
] as const

const interactionIcons: Record<string, { icon: typeof Phone; color: string; bg: string; label: string }> = {
  call: { icon: Phone, color: 'text-blue-600', bg: 'bg-blue-100', label: '電話' },
  email: { icon: Mail, color: 'text-amber-600', bg: 'bg-amber-100', label: 'メール' },
  meeting: { icon: UsersIcon, color: 'text-green-600', bg: 'bg-green-100', label: '面談' },
  line: { icon: FileEdit, color: 'text-emerald-600', bg: 'bg-emerald-100', label: 'LINE' },
}

const teleapoStatusLabels: Record<string, string> = {
  scheduled: '予定',
  completed: '完了',
  no_answer: '不在',
  callback: '折返し',
}

// Pipeline stages (excluding lost)
const pipelineStages = stages.filter(s => s.key !== 'lost')

export function CRM() {
  const [expandedDeal, setExpandedDeal] = useState<string | null>(null)

  // Calculate KPIs
  const activeDeals = mockDeals.filter(d => d.stage !== 'lost' && d.stage !== 'won')
  const wonDeals = mockDeals.filter(d => d.stage === 'won')
  const lostDeals = mockDeals.filter(d => d.stage === 'lost')
  const pipelineTotal = activeDeals.reduce((sum, d) => sum + d.amount, 0)
  const wonTotal = wonDeals.reduce((sum, d) => sum + d.amount, 0)
  const winRate = Math.round((wonDeals.length / (wonDeals.length + lostDeals.length)) * 1000) / 10
  const monthTarget = 5000000

  // Customer ranking
  const contactDealTotals = mockContacts.map((c) => {
    const deals = mockDeals.filter((d) => d.contact_id === c.id && d.stage !== 'lost')
    const total = deals.reduce((sum, d) => sum + d.amount, 0)
    return { ...c, totalDealAmount: total, dealCount: deals.length }
  }).sort((a, b) => b.totalDealAmount - a.totalDealAmount).filter(c => c.totalDealAmount > 0)

  // Pipeline data
  const pipelineData = pipelineStages.map((stage) => {
    const deals = mockDeals.filter((d) => d.stage === stage.key)
    return {
      ...stage,
      deals,
      total: deals.reduce((sum, d) => sum + d.amount, 0),
      count: deals.length,
    }
  })

  // Connection rate donut data
  const connectionData = [
    { name: '接続', value: mockTeleapoDailyStats.connected, color: '#22c55e' },
    { name: '未接続', value: mockTeleapoDailyStats.totalCalls - mockTeleapoDailyStats.connected, color: '#e5e7eb' },
  ]

  // Upcoming calls
  const upcomingCalls = mockTeleapoSchedule.filter(s => s.status === 'scheduled')

  return (
    <Layout>
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">営業・CRM</h1>
          <p className="text-gray-500 mt-1">商談パイプライン・顧客対応・テレアポ管理</p>
        </div>

        {/* ── KPI Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* パイプライン合計 */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <p className="text-sm font-medium text-gray-500">パイプライン合計</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{formatYen(pipelineTotal)}</p>
            {/* Mini stage breakdown bar */}
            <div className="mt-3 flex rounded-full overflow-hidden h-2">
              {pipelineData.filter(p => p.total > 0).map((p) => (
                <div
                  key={p.key}
                  className="h-full"
                  style={{
                    width: `${(p.total / pipelineTotal) * 100}%`,
                    backgroundColor: p.color,
                  }}
                  title={`${p.label}: ${formatYen(p.total)}`}
                />
              ))}
            </div>
            <div className="flex gap-3 mt-2">
              {pipelineData.filter(p => p.total > 0).map((p) => (
                <div key={p.key} className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                  <span className="text-[10px] text-gray-500">{p.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 今月の成約額 */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <p className="text-sm font-medium text-gray-500">今月の成約額</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{formatYen(wonTotal)}</p>
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                <span>目標: {formatYen(monthTarget)}</span>
                <span>{Math.round((wonTotal / monthTarget) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5">
                <div
                  className="h-2.5 rounded-full transition-all"
                  style={{
                    width: `${Math.min((wonTotal / monthTarget) * 100, 100)}%`,
                    backgroundColor: wonTotal >= monthTarget ? '#22c55e' : '#3b82f6',
                  }}
                />
              </div>
            </div>
          </div>

          {/* 成約率 */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <p className="text-sm font-medium text-gray-500">成約率</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{winRate}%</p>
            <div className="flex items-center gap-1.5 mt-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-sm font-semibold text-green-600">+5.2%</span>
              <span className="text-xs text-gray-400">前月比</span>
            </div>
          </div>

          {/* アクティブ商談数 */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <p className="text-sm font-medium text-gray-500">アクティブ商談数</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{activeDeals.length}件</p>
            <div className="flex items-center gap-1.5 mt-2">
              <Target className="w-4 h-4 text-blue-500" />
              <span className="text-sm text-gray-500">加重期待値: {formatYenShort(activeDeals.reduce((sum, d) => sum + d.amount * d.probability / 100, 0))}</span>
            </div>
          </div>
        </div>

        {/* ── Row 1: Pipeline Funnel ── */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-5">パイプラインフロー</h2>
          <div className="flex items-stretch gap-0">
            {pipelineData.map((stage, idx) => {
              return (
                <div key={stage.key} className="flex items-center flex-1 min-w-0">
                  {/* Conversion rate arrow */}
                  {idx > 0 && (
                    <div className="flex flex-col items-center px-1 shrink-0">
                      <ArrowRight className="w-5 h-5 text-gray-300" />
                      <span className="text-[10px] font-bold text-gray-400 mt-0.5">
                        {idx === 1 ? '75%' : idx === 2 ? '63%' : '60%'}
                      </span>
                    </div>
                  )}

                  {/* Stage block */}
                  <div
                    className="flex-1 rounded-lg border overflow-hidden"
                    style={{
                      borderColor: stage.color + '40',
                      backgroundColor: stage.color + '08',
                    }}
                  >
                    {/* Stage header */}
                    <div
                      className="px-3 py-2"
                      style={{ backgroundColor: stage.color + '15' }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold" style={{ color: stage.color }}>{stage.label}</span>
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-white/80 text-gray-600">
                          {stage.count}件
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-gray-600 mt-0.5">{formatYen(stage.total)}</p>
                    </div>

                    {/* Deal cards inside stage */}
                    <div className="p-2 space-y-1.5 max-h-40 overflow-y-auto">
                      {stage.deals.map((deal) => (
                        <div
                          key={deal.id}
                          className="bg-white rounded-md p-2 border border-gray-100 shadow-sm text-xs"
                        >
                          <p className="font-semibold text-gray-900 truncate">{deal.company_name}</p>
                          <div className="flex items-center justify-between mt-1">
                            <span className="font-bold text-gray-700">{formatYen(deal.amount)}</span>
                            <span className="text-gray-400">{deal.assigned_to.split(' ')[0]}</span>
                          </div>
                        </div>
                      ))}
                      {stage.deals.length === 0 && (
                        <p className="text-xs text-gray-400 text-center py-3">案件なし</p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Row 2: Kanban + Sales Forecast ── */}
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
          {/* Kanban Board (3/5 width) */}
          <div className="xl:col-span-3 bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">商談ボード</h2>
            <div className="grid grid-cols-5 gap-3">
              {stages.map((stage) => {
                const deals = mockDeals.filter(d => d.stage === stage.key)
                const total = deals.reduce((sum, d) => sum + d.amount, 0)
                return (
                  <div key={stage.key} className="min-w-0">
                    {/* Column header */}
                    <div className="mb-3">
                      <div className="flex items-center gap-1.5 mb-1">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: stage.color }} />
                        <span className="text-xs font-bold text-gray-700">{stage.label}</span>
                        <span className="text-[10px] text-gray-400 ml-auto">{deals.length}</span>
                      </div>
                      <p className="text-[10px] text-gray-500">{formatYenShort(total)}</p>
                    </div>

                    {/* Deal cards */}
                    <div className="space-y-2">
                      {deals.map((deal) => (
                        <div
                          key={deal.id}
                          className={`bg-white rounded-lg p-3 border border-gray-100 shadow-sm border-l-[3px] ${stage.borderColor} hover:shadow-md transition-shadow cursor-pointer`}
                          onClick={() => setExpandedDeal(expandedDeal === deal.id ? null : deal.id)}
                        >
                          <p className="text-xs font-medium text-gray-900 leading-tight">{deal.title}</p>
                          <p className="text-[10px] text-gray-500 mt-1 truncate">{deal.company_name}</p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs font-bold text-gray-900">{formatYenShort(deal.amount)}</span>
                          </div>
                          <div className="flex items-center justify-between mt-1.5">
                            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                              <span className="text-[8px] text-white font-bold">{deal.assigned_to[0]}</span>
                            </div>
                            <div className="flex items-center gap-1 text-[10px] text-gray-400">
                              <Calendar className="w-3 h-3" />
                              <span>{deal.expected_close_date.slice(5)}</span>
                            </div>
                          </div>
                          {expandedDeal === deal.id && (
                            <div className="mt-2 pt-2 border-t border-gray-100 text-[10px] text-gray-500 space-y-0.5">
                              <p>確度: {deal.probability}%</p>
                              <p>担当: {deal.assigned_to}</p>
                              <p>更新: {deal.updated_at}</p>
                            </div>
                          )}
                        </div>
                      ))}
                      {deals.length === 0 && (
                        <p className="text-xs text-gray-400 text-center py-6">案件なし</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Sales Forecast (2/5 width) */}
          <div className="xl:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">売上予測</h2>
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mockSalesForecast} barGap={2}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                  <YAxis
                    tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`}
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    width={45}
                  />
                  <Tooltip
                    formatter={(value, name) => [
                      formatYen(Number(value)),
                      name === 'actual' ? '実績' : name === 'target' ? '目標' : '予測'
                    ]}
                    contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
                  />
                  <Legend
                    formatter={(value) => value === 'actual' ? '実績' : value === 'target' ? '目標' : '予測'}
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: 11 }}
                  />
                  <Bar dataKey="actual" fill="#22c55e" radius={[4, 4, 0, 0]} maxBarSize={24} />
                  <Bar dataKey="target" fill="#e5e7eb" radius={[4, 4, 0, 0]} maxBarSize={24} />
                  <Bar dataKey="forecast" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3 text-center">
              <div className="p-2 bg-green-50 rounded-lg">
                <p className="text-[10px] text-green-600 font-medium">今月実績</p>
                <p className="text-sm font-bold text-green-700">{formatYenShort(3500000)}</p>
              </div>
              <div className="p-2 bg-gray-50 rounded-lg">
                <p className="text-[10px] text-gray-500 font-medium">今月目標</p>
                <p className="text-sm font-bold text-gray-700">{formatYenShort(5000000)}</p>
              </div>
              <div className="p-2 bg-blue-50 rounded-lg">
                <p className="text-[10px] text-blue-600 font-medium">来月予測</p>
                <p className="text-sm font-bold text-blue-700">{formatYenShort(5800000)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Row 3: Activity / Customer Ranking / Teleapo Stats ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Activity Timeline */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">最近のアクティビティ</h2>
            <div className="space-y-0">
              {mockInteractions.map((interaction, idx) => {
                const typeInfo = interactionIcons[interaction.type] || interactionIcons.call
                const IconComponent = typeInfo.icon
                return (
                  <div key={interaction.id} className="flex gap-3">
                    {/* Timeline line */}
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full ${typeInfo.bg} flex items-center justify-center shrink-0`}>
                        <IconComponent className={`w-4 h-4 ${typeInfo.color}`} />
                      </div>
                      {idx < mockInteractions.length - 1 && (
                        <div className="w-0.5 flex-1 bg-gray-100 my-1" />
                      )}
                    </div>
                    {/* Content */}
                    <div className="pb-5 min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`inline-flex items-center px-2 py-0.5 ${typeInfo.bg} ${typeInfo.color} rounded text-[10px] font-bold`}>
                          {typeInfo.label}
                        </span>
                        <span className="text-sm font-semibold text-gray-900 truncate">{interaction.company_name}</span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1 leading-relaxed">{interaction.summary}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[10px] text-gray-400">{interaction.created_by}</span>
                        <span className="text-[10px] text-gray-300">|</span>
                        <div className="flex items-center gap-0.5 text-[10px] text-gray-400">
                          <Clock className="w-3 h-3" />
                          {interaction.date}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Customer Ranking */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">顧客ランキング</h2>
            <div className="space-y-3">
              {contactDealTotals.map((contact, i) => {
                const medals = ['bg-amber-100 text-amber-600 border-amber-300', 'bg-gray-100 text-gray-500 border-gray-300', 'bg-orange-100 text-orange-600 border-orange-300']
                const medalEmoji = i === 0 ? '1' : i === 1 ? '2' : i === 2 ? '3' : String(i + 1)
                return (
                  <div key={contact.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 border ${i < 3 ? medals[i] : 'bg-gray-50 text-gray-400 border-gray-200'}`}>
                      {medalEmoji}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900 truncate">{contact.company_name}</p>
                      <p className="text-xs text-gray-500">{contact.person_name}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-gray-900">{formatYen(contact.totalDealAmount)}</p>
                      <p className="text-[10px] text-gray-400">{contact.dealCount}件</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Teleapo Stats */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">テレアポ実績</h2>

            {/* Today's stats */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-700">{mockTeleapoDailyStats.totalCalls}</p>
                <p className="text-[10px] text-blue-600 font-medium mt-0.5">架電数</p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-700">{mockTeleapoDailyStats.connected}</p>
                <p className="text-[10px] text-green-600 font-medium mt-0.5">接続数</p>
              </div>
              <div className="text-center p-3 bg-amber-50 rounded-lg">
                <p className="text-2xl font-bold text-amber-700">{mockTeleapoDailyStats.appointments}</p>
                <p className="text-[10px] text-amber-600 font-medium mt-0.5">アポ獲得</p>
              </div>
            </div>

            {/* Connection rate donut */}
            <div className="flex items-center gap-4 mb-5">
              <div className="w-20 h-20 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={connectionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={24}
                      outerRadius={36}
                      paddingAngle={2}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {connectionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{mockTeleapoDailyStats.connectionRate}%</p>
                <p className="text-xs text-gray-500">接続率</p>
              </div>
            </div>

            {/* Upcoming calls */}
            <div>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">次の架電予定</h3>
              <div className="space-y-2">
                {upcomingCalls.map((call) => (
                  <div key={call.id} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                      <Phone className="w-3.5 h-3.5 text-blue-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-gray-900 truncate">{call.company_name}</p>
                      <p className="text-[10px] text-gray-500">{call.contact_name}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[10px] font-medium text-gray-600">{call.scheduled_at.slice(11)}</p>
                      <p className="text-[10px] text-gray-400">{call.assigned_to.split(' ')[0]}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Row 4: Teleapo Schedule Table ── */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">テレアポスケジュール</h2>
            <span className="text-xs text-gray-400">{mockTeleapoSchedule.length}件</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="pb-3 text-left font-semibold text-gray-500 text-xs uppercase tracking-wider">予定日時</th>
                  <th className="pb-3 text-left font-semibold text-gray-500 text-xs uppercase tracking-wider">企業名</th>
                  <th className="pb-3 text-left font-semibold text-gray-500 text-xs uppercase tracking-wider">担当者</th>
                  <th className="pb-3 text-left font-semibold text-gray-500 text-xs uppercase tracking-wider">電話番号</th>
                  <th className="pb-3 text-left font-semibold text-gray-500 text-xs uppercase tracking-wider">担当</th>
                  <th className="pb-3 text-center font-semibold text-gray-500 text-xs uppercase tracking-wider">ステータス</th>
                  <th className="pb-3 text-left font-semibold text-gray-500 text-xs uppercase tracking-wider">結果</th>
                </tr>
              </thead>
              <tbody>
                {mockTeleapoSchedule.map((sched, i) => (
                  <tr
                    key={sched.id}
                    className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${i % 2 === 0 ? 'bg-gray-50/30' : ''}`}
                  >
                    <td className="py-3.5">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-gray-900 font-medium">{sched.scheduled_at}</span>
                      </div>
                    </td>
                    <td className="py-3.5 text-gray-900 font-semibold">{sched.company_name}</td>
                    <td className="py-3.5 text-gray-600">{sched.contact_name}</td>
                    <td className="py-3.5">
                      <span className="font-mono text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">{sched.phone}</span>
                    </td>
                    <td className="py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                          <span className="text-[9px] text-white font-bold">{sched.assigned_to[0]}</span>
                        </div>
                        <span className="text-gray-600">{sched.assigned_to}</span>
                      </div>
                    </td>
                    <td className="py-3.5 text-center">
                      <StatusBadge status={sched.status} label={teleapoStatusLabels[sched.status]} />
                    </td>
                    <td className="py-3.5 text-gray-600 max-w-48">{sched.result ?? <span className="text-gray-300">-</span>}</td>
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
