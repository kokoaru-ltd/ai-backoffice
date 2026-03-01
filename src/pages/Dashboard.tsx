import {
  Bot,
  Check,
  X as XIcon,
  Calculator,
  Handshake,
  Users,
  FileText,
  Building2,
  AlertCircle,
  ArrowRight,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { Layout } from '../components/Layout'
import { StatCard } from '../components/StatCard'
import {
  mockMonthlyRevenue,
  mockExpenseCategories,
  mockCashFlowForecast,
  mockReceivableAging,
  mockPipelineFunnel,
  mockPendingApprovals,
  mockDashboardAuditLogs,
  mockRevenueSparkline,
  mockProfitSparkline,
  mockCashSparkline,
} from '../lib/mockData'

const formatYen = (v: number) => `\u00a5${v.toLocaleString()}`
const formatMillions = (v: number) => `${(v / 1000000).toFixed(1)}M`

// ドメイン別アイコンマッピング
const domainIcons: Record<string, typeof Calculator> = {
  accounting: Calculator,
  crm: Handshake,
  hr: Users,
  documents: FileText,
  general: Building2,
}

const domainColors: Record<string, string> = {
  accounting: 'bg-blue-100 text-blue-600',
  crm: 'bg-purple-100 text-purple-600',
  hr: 'bg-green-100 text-green-600',
  documents: 'bg-amber-100 text-amber-600',
  general: 'bg-slate-100 text-slate-600',
}

export function Dashboard() {
  return (
    <Layout>
      <div className="space-y-5">
        {/* ページヘッダー */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">経営ダッシュボード</h1>
          <p className="text-gray-500 mt-1 text-sm">2026年2月度 経営概況</p>
        </div>

        {/* ========== 第1行: KPIカード 6枚1行 ========== */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          {/* 売上高 */}
          <StatCard
            label="売上高"
            value={formatYen(15200000)}
            trend={{ value: '12.3%', positive: true }}
            subtitle="前月比 +¥1,400,000"
            sparklineData={mockRevenueSparkline}
            sparklineColor="#2563eb"
            accentColor="#2563eb"
          />

          {/* 営業利益 */}
          <StatCard
            label="営業利益"
            value={formatYen(4400000)}
            trend={{ value: '8.5%', positive: true }}
            subtitle="利益率 28.9%"
            sparklineData={mockProfitSparkline}
            sparklineColor="#16a34a"
            accentColor="#16a34a"
          />

          {/* 売掛金残高 */}
          <StatCard
            label="売掛金残高"
            value={formatYen(8730000)}
            subtitle="エージング内訳"
            accentColor="#f59e0b"
          >
            {/* ミニエージングバー */}
            <div className="flex gap-0.5 h-2 rounded-full overflow-hidden">
              {mockReceivableAging.map((item) => (
                <div
                  key={item.category}
                  className="h-full rounded-sm"
                  style={{
                    backgroundColor: item.color,
                    width: `${(item.amount / 8730000) * 100}%`,
                  }}
                  title={`${item.category}: ${formatYen(item.amount)}`}
                />
              ))}
            </div>
            <div className="flex justify-between mt-1.5">
              <span className="text-[10px] text-gray-400">未到来</span>
              <span className="text-[10px] text-red-400">90日超</span>
            </div>
          </StatCard>

          {/* 買掛金残高 */}
          <StatCard
            label="買掛金残高"
            value={formatYen(3200000)}
            trend={{ value: '2.1%', positive: false }}
            subtitle="支払予定: 3/15 ¥1,800,000"
            accentColor="#dc2626"
          />

          {/* 現預金残高 */}
          <StatCard
            label="現預金残高"
            value={formatYen(12500000)}
            trend={{ value: '4.2%', positive: true }}
            subtitle="月末予測: ¥13,200,000"
            sparklineData={mockCashSparkline}
            sparklineColor="#7c3aed"
            accentColor="#7c3aed"
          />

          {/* AI処理件数 */}
          <StatCard
            label="今月のAI処理件数"
            value="847件"
            subtitle="成功率 99.2%"
            accentColor="#2563eb"
          >
            {/* 成功率バー */}
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full"
                  style={{ width: '99.2%' }}
                />
              </div>
              <span className="text-xs font-semibold text-blue-600">99.2%</span>
            </div>
          </StatCard>
        </div>

        {/* ========== 第2行: 売上推移 + 経費カテゴリ ========== */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* 売上・利益推移（12ヶ月） */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">売上・利益推移</h2>
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mockMonthlyRevenue}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2563eb" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="#2563eb" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12, fill: '#94a3b8' }}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    tickFormatter={(v: number) => `${(v / 1000000).toFixed(0)}M`}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(value, name) => [
                      formatYen(Number(value ?? 0)),
                      name === 'revenue' ? '売上' : name === 'profit' ? '営業利益' : String(name),
                    ]}
                    labelStyle={{ fontWeight: 600, color: '#1e293b' }}
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                    }}
                  />
                  <Legend
                    formatter={(value) =>
                      value === 'revenue' ? '売上' : value === 'profit' ? '営業利益' : value
                    }
                    iconType="circle"
                    wrapperStyle={{ fontSize: 12 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    name="revenue"
                    stroke="#2563eb"
                    strokeWidth={2}
                    fill="url(#revGrad)"
                    dot={false}
                    activeDot={{ r: 4, fill: '#2563eb' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="profit"
                    name="profit"
                    stroke="#16a34a"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, fill: '#16a34a' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 経費カテゴリ別内訳 */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">経費カテゴリ別内訳</h2>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={mockExpenseCategories}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    dataKey="value"
                    nameKey="name"
                    strokeWidth={2}
                    stroke="#fff"
                  >
                    {mockExpenseCategories.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, name) => [`${value ?? 0}%`, String(name)]}
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      fontSize: 13,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* 凡例 */}
            <div className="space-y-2 mt-2">
              {mockExpenseCategories.map((cat) => (
                <div key={cat.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="text-xs text-gray-600">{cat.name}</span>
                  </div>
                  <span className="text-xs font-semibold text-gray-900">{cat.percentage}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ========== 第3行: キャッシュフロー + 承認待ち + AI操作ログ ========== */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* キャッシュフロー予測 */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">キャッシュフロー予測</h2>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mockCashFlowForecast} barGap={2}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12, fill: '#94a3b8' }}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    tickFormatter={(v: number) => formatMillions(v)}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(value, name) => [
                      formatYen(Number(value ?? 0)),
                      name === 'inflow'
                        ? '入金予定'
                        : name === 'outflow'
                        ? '出金予定'
                        : '収支差額',
                    ]}
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      fontSize: 13,
                    }}
                  />
                  <Legend
                    formatter={(value) =>
                      value === 'inflow'
                        ? '入金予定'
                        : value === 'outflow'
                        ? '出金予定'
                        : '収支差額'
                    }
                    iconType="circle"
                    wrapperStyle={{ fontSize: 11 }}
                  />
                  <Bar dataKey="inflow" name="inflow" fill="#2563eb" radius={[4, 4, 0, 0]} barSize={20} />
                  <Bar dataKey="outflow" name="outflow" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={20} />
                  <Line
                    type="monotone"
                    dataKey="net"
                    name="net"
                    stroke="#16a34a"
                    strokeWidth={2}
                    dot={{ r: 3, fill: '#16a34a' }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 承認待ちタスク */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-900">承認待ちタスク</h2>
              <span className="text-xs font-semibold text-white bg-red-500 rounded-full px-2 py-0.5">
                {mockPendingApprovals.length}
              </span>
            </div>
            <div className="space-y-3 overflow-y-auto max-h-64">
              {mockPendingApprovals.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-all duration-150"
                >
                  {/* アバター */}
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-sm font-bold text-slate-600 shrink-0">
                    {item.avatar}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{item.description}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      {item.amount > 0 && (
                        <span className="text-xs font-semibold text-gray-900">
                          {formatYen(item.amount)}
                        </span>
                      )}
                      <span className="text-[10px] text-gray-400">{item.timeAgo}</span>
                    </div>
                  </div>
                  {/* 承認/却下ボタン */}
                  <div className="flex gap-1 shrink-0 mt-0.5">
                    <button className="w-7 h-7 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 flex items-center justify-center transition-colors">
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button className="w-7 h-7 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center transition-colors">
                      <XIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI操作ログ（タイムライン） */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-900">AI操作ログ</h2>
              <Bot className="w-4 h-4 text-blue-500" />
            </div>
            <div className="space-y-0 relative">
              {/* タイムラインライン */}
              <div className="absolute left-[17px] top-2 bottom-2 w-px bg-gray-100" />

              {mockDashboardAuditLogs.map((log, index) => {
                const DomainIcon = domainIcons[log.domain] || Building2
                const colorClass = domainColors[log.domain] || 'bg-gray-100 text-gray-600'
                const isError = log.icon === 'alert'

                return (
                  <div
                    key={log.id}
                    className={`relative flex items-start gap-3 py-2.5 ${
                      index < mockDashboardAuditLogs.length - 1
                        ? 'border-b border-gray-50'
                        : ''
                    }`}
                  >
                    {/* アイコン */}
                    <div
                      className={`w-[34px] h-[34px] rounded-lg flex items-center justify-center shrink-0 z-10 ${
                        isError ? 'bg-red-100 text-red-600' : colorClass
                      }`}
                    >
                      {isError ? (
                        <AlertCircle className="w-4 h-4" />
                      ) : (
                        <DomainIcon className="w-4 h-4" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm ${isError ? 'text-red-600' : 'text-gray-900'}`}>
                        {log.action}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-gray-500">{log.userName}</span>
                        <span className="text-[10px] text-gray-400">{log.timestamp}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* ========== 第4行: 売掛金エージング + パイプラインファネル ========== */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* 売掛金エージング */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">売掛金エージング</h2>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={mockReceivableAging}
                  layout="vertical"
                  barSize={28}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#f1f5f9"
                    horizontal={false}
                  />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    tickFormatter={(v: number) => formatMillions(v)}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="category"
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                    width={70}
                  />
                  <Tooltip
                    formatter={(value) => [formatYen(Number(value ?? 0)), '金額']}
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      fontSize: 13,
                    }}
                  />
                  <Bar dataKey="amount" radius={[0, 6, 6, 0]}>
                    {mockReceivableAging.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            {/* 合計表示 */}
            <div className="flex items-center justify-between mt-2 pt-3 border-t border-gray-100">
              <span className="text-sm text-gray-500">合計</span>
              <span className="text-base font-bold text-gray-900">{formatYen(8730000)}</span>
            </div>
          </div>

          {/* 商談パイプライン サマリー */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">
              商談パイプライン サマリー
            </h2>

            {/* ファネル表示 */}
            <div className="space-y-3">
              {mockPipelineFunnel.map((stage, index) => {
                // ファネル幅を段階的に縮小
                const widthPercent = 100 - index * 15
                const stageColors = [
                  'bg-blue-500',
                  'bg-indigo-500',
                  'bg-purple-500',
                  'bg-green-500',
                ]

                return (
                  <div key={stage.stage}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium text-gray-700">{stage.label}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-gray-900">
                          {formatYen(stage.amount)}
                        </span>
                        <span className="text-xs text-gray-500">{stage.count}件</span>
                      </div>
                    </div>
                    {/* ファネルバー */}
                    <div className="flex justify-center">
                      <div
                        className={`h-8 ${stageColors[index]} rounded-md flex items-center justify-center transition-all duration-300`}
                        style={{ width: `${widthPercent}%` }}
                      >
                        <span className="text-xs font-semibold text-white">
                          {formatYen(stage.amount)}
                        </span>
                      </div>
                    </div>
                    {/* コンバージョンレート矢印 */}
                    {stage.conversionRate && (
                      <div className="flex items-center justify-center gap-1 mt-1.5">
                        <ArrowRight className="w-3 h-3 text-gray-400 rotate-90" />
                        <span className="text-[11px] font-medium text-gray-500">
                          転換率 {stage.conversionRate}%
                        </span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* サマリー統計 */}
            <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-gray-100">
              <div className="text-center">
                <p className="text-xs text-gray-500">パイプライン合計</p>
                <p className="text-sm font-bold text-gray-900 mt-0.5">{formatYen(30900000)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500">案件数</p>
                <p className="text-sm font-bold text-gray-900 mt-0.5">28件</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500">平均成約率</p>
                <p className="text-sm font-bold text-green-600 mt-0.5">60%</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
