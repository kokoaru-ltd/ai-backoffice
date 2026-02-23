import {
  TrendingUp,
  Receipt,
  Handshake,
  AlertTriangle,
  Clock,
} from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Layout } from '../components/Layout'
import { StatCard } from '../components/StatCard'
import { StatusBadge } from '../components/StatusBadge'
import {
  mockMonthlyRevenue,
  mockDeals,
  mockExpenses,
  mockOvertimeRanking,
  mockAuditLogs,
} from '../lib/mockData'

const formatYen = (v: number) => `\u00a5${v.toLocaleString()}`

// パイプライン合計
const pipelineTotal = mockDeals
  .filter((d) => d.stage !== 'won' && d.stage !== 'lost')
  .reduce((sum, d) => sum + d.amount, 0)

// 残業アラート数（36h超え）
const overtimeAlerts = mockOvertimeRanking.filter((e) => e.hours > 36).length

// 承認待ち
const pendingApprovals = mockExpenses.filter((e) => e.status === 'pending').length

export function Dashboard() {
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ダッシュボード</h1>
          <p className="text-gray-500 mt-1">経営概況の確認</p>
        </div>

        {/* サマリーカード */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
          <StatCard
            icon={TrendingUp}
            label="今月の売上"
            value={formatYen(15200000)}
            trend={{ value: '10.1% 前月比', positive: true }}
            iconColor="text-green-600"
            iconBg="bg-green-50"
          />
          <StatCard
            icon={Receipt}
            label="経費合計"
            value={formatYen(245800)}
            trend={{ value: '3件 承認待ち', positive: false }}
            iconColor="text-orange-600"
            iconBg="bg-orange-50"
          />
          <StatCard
            icon={Handshake}
            label="商談パイプライン"
            value={formatYen(pipelineTotal)}
            iconColor="text-purple-600"
            iconBg="bg-purple-50"
          />
          <StatCard
            icon={AlertTriangle}
            label="勤怠異常"
            value={`${overtimeAlerts}件`}
            trend={{ value: '36協定超過', positive: false }}
            iconColor="text-red-600"
            iconBg="bg-red-50"
          />
          <StatCard
            icon={Clock}
            label="承認待ち"
            value={`${pendingApprovals}件`}
            iconColor="text-blue-600"
            iconBg="bg-blue-50"
          />
        </div>

        {/* 売上推移チャート */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">売上推移（直近6ヶ月）</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockMonthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 13 }} />
                <YAxis
                  tick={{ fontSize: 12 }}
                  tickFormatter={(v: number) => `${(v / 1000000).toFixed(0)}M`}
                />
                <Tooltip
                  formatter={(value) => [formatYen(value as number)]}
                  labelStyle={{ fontWeight: 'bold' }}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  name="売上"
                  stroke="#2563eb"
                  strokeWidth={2.5}
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="expenses"
                  name="経費"
                  stroke="#f97316"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  strokeDasharray="5 5"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 下段：最近の操作ログと商談 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 最近のAI操作 */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">最近のAI操作</h2>
            <div className="space-y-3">
              {mockAuditLogs.slice(0, 5).map((log) => (
                <div key={log.id} className="flex items-start gap-3 py-2 border-b border-gray-100 last:border-0">
                  <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${log.success ? 'bg-green-500' : 'bg-red-500'}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-gray-900">{log.detail}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500">{log.user_name}</span>
                      <span className="text-xs text-gray-400">{log.timestamp.split(' ')[1]}</span>
                    </div>
                  </div>
                  <StatusBadge status={log.domain} label={log.domain.toUpperCase()} />
                </div>
              ))}
            </div>
          </div>

          {/* 進行中の商談 */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">進行中の商談</h2>
            <div className="space-y-3">
              {mockDeals
                .filter((d) => d.stage !== 'won' && d.stage !== 'lost')
                .slice(0, 5)
                .map((deal) => (
                  <div key={deal.id} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">{deal.title}</p>
                      <p className="text-xs text-gray-500">{deal.company_name}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-gray-900">{formatYen(deal.amount)}</p>
                      <StatusBadge status={deal.stage} />
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
