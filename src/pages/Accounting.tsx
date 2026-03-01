import { useState } from 'react'
import {
  Area,
  Bar,
  Line,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { Layout } from '../components/Layout'
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  FileText,
} from 'lucide-react'
import {
  mockMonthlyRevenue,
  mockPLSummary,
  mockPaymentSchedule,
  mockAccountsReceivable,
  mockJournalEntries,
  mockExpenseCategoryDonut,
} from '../lib/mockData'

const formatYen = (v: number) => `\u00a5${v.toLocaleString()}`

type PeriodTab = 'current' | 'previous' | 'quarter' | 'annual'

export function Accounting() {
  const [period, setPeriod] = useState<PeriodTab>('current')

  const currentPL = mockPLSummary[mockPLSummary.length - 1]
  const previousPL = mockPLSummary[mockPLSummary.length - 2]

  // 前月比計算
  const calcChange = (current: number, previous: number) => {
    if (previous === 0) return 0
    return ((current - previous) / previous) * 100
  }

  const grossMarginRate = ((currentPL.gross_profit / currentPL.revenue) * 100).toFixed(1)
  const operatingMarginRate = ((currentPL.operating_income / currentPL.revenue) * 100).toFixed(1)

  const plCards = [
    {
      label: '売上高',
      value: currentPL.revenue,
      change: calcChange(currentPL.revenue, previousPL.revenue),
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      label: '売上原価',
      value: currentPL.cost_of_sales,
      change: calcChange(currentPL.cost_of_sales, previousPL.cost_of_sales),
      color: 'text-gray-700',
      bgColor: 'bg-gray-50',
    },
    {
      label: '売上総利益',
      value: currentPL.gross_profit,
      change: calcChange(currentPL.gross_profit, previousPL.gross_profit),
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      subtitle: `粗利率 ${grossMarginRate}%`,
    },
    {
      label: '販管費',
      value: currentPL.operating_expenses,
      change: calcChange(currentPL.operating_expenses, previousPL.operating_expenses),
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      label: '営業利益',
      value: currentPL.operating_income,
      change: calcChange(currentPL.operating_income, previousPL.operating_income),
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      subtitle: `営業利益率 ${operatingMarginRate}%`,
    },
  ]

  // 入出金合計
  const totalIncome = mockPaymentSchedule
    .filter((p) => p.type === 'income')
    .reduce((sum, p) => sum + p.amount, 0)
  const totalExpense = mockPaymentSchedule
    .filter((p) => p.type === 'expense')
    .reduce((sum, p) => sum + p.amount, 0)

  // ドーナツの合計
  const donutTotal = mockExpenseCategoryDonut.reduce((sum, c) => sum + c.value, 0)

  // PL推移テーブル合計
  const plTotals = mockPLSummary.reduce(
    (acc, row) => ({
      revenue: acc.revenue + row.revenue,
      cost_of_sales: acc.cost_of_sales + row.cost_of_sales,
      gross_profit: acc.gross_profit + row.gross_profit,
      operating_expenses: acc.operating_expenses + row.operating_expenses,
      operating_income: acc.operating_income + row.operating_income,
    }),
    { revenue: 0, cost_of_sales: 0, gross_profit: 0, operating_expenses: 0, operating_income: 0 }
  )

  const periodTabs: { key: PeriodTab; label: string }[] = [
    { key: 'current', label: '当月' },
    { key: 'previous', label: '前月' },
    { key: 'quarter', label: '四半期' },
    { key: 'annual', label: '年間' },
  ]

  return (
    <Layout>
      <div className="space-y-5">
        {/* ── ヘッダー: 期間セレクタ ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">経理・会計</h1>
            <p className="text-gray-500 mt-1 text-sm">損益・キャッシュフロー・未収金管理</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex bg-gray-100 rounded-lg p-1">
              {periodTabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setPeriod(tab.key)}
                  className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                    period === tab.key
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">2026年2月</span>
            </div>
          </div>
        </div>

        {/* ── Row 1: PL サマリーカード (5枚) ── */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {plCards.map((card) => {
            const isPositive = card.change >= 0
            // 販管費は増加がネガティブ
            const isGood =
              card.label === '販管費' || card.label === '売上原価' ? !isPositive : isPositive
            return (
              <div
                key={card.label}
                className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    {card.label}
                  </span>
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${card.bgColor}`}
                  >
                    {isGood ? (
                      <TrendingUp className={`w-4 h-4 ${card.color}`} />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                </div>
                <p className={`text-xl font-bold ${card.color}`}>{formatYen(card.value)}</p>
                <div className="flex items-center gap-1 mt-2">
                  {isGood ? (
                    <ArrowUpRight className="w-3.5 h-3.5 text-green-500" />
                  ) : (
                    <ArrowDownRight className="w-3.5 h-3.5 text-red-500" />
                  )}
                  <span
                    className={`text-xs font-medium ${isGood ? 'text-green-600' : 'text-red-600'}`}
                  >
                    {isPositive ? '+' : ''}
                    {card.change.toFixed(1)}% vs前月
                  </span>
                </div>
                {card.subtitle && (
                  <p className="text-xs text-gray-400 mt-1">{card.subtitle}</p>
                )}
              </div>
            )
          })}
        </div>

        {/* ── Row 2: 月次推移チャート + 経費内訳ドーナツ ── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          {/* 月次推移チャート (60%) */}
          <div className="lg:col-span-3 bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">月次推移チャート</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={mockMonthlyRevenue} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    axisLine={{ stroke: '#e5e7eb' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#9ca3af' }}
                    tickFormatter={(v: number) => `${(v / 1000000).toFixed(0)}M`}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(value) => [formatYen(value as number)]}
                    contentStyle={{
                      borderRadius: '12px',
                      border: '1px solid #e5e7eb',
                      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                      fontSize: '13px',
                    }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    name="売上高"
                    fill="url(#revenueGradient)"
                    stroke="#2563eb"
                    strokeWidth={2}
                  />
                  <Bar
                    dataKey="expenses"
                    name="経費"
                    fill="#f97316"
                    fillOpacity={0.7}
                    radius={[4, 4, 0, 0]}
                    barSize={24}
                  />
                  <Line
                    type="monotone"
                    dataKey="profit"
                    name="営業利益"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 経費内訳ドーナツ (40%) */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">経費内訳</h2>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={mockExpenseCategoryDonut}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    label={({ name, value }) =>
                      `${name} ${((value / donutTotal) * 100).toFixed(0)}%`
                    }
                    labelLine={{ strokeWidth: 1, stroke: '#d1d5db' }}
                  >
                    {mockExpenseCategoryDonut.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [formatYen(value as number)]}
                    contentStyle={{
                      borderRadius: '12px',
                      border: '1px solid #e5e7eb',
                      fontSize: '13px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* 凡例 */}
            <div className="mt-2 space-y-1.5">
              {mockExpenseCategoryDonut.map((cat) => (
                <div key={cat.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="text-gray-600">{cat.name}</span>
                  </div>
                  <span className="text-gray-900 font-medium">{formatYen(cat.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Row 3: 入出金スケジュール + 未収金 + 最近の仕訳 ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* 入金・出金スケジュール */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">入金・出金スケジュール</h2>
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {mockPaymentSchedule.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-start gap-3 py-2 border-b border-gray-50 last:border-0 rounded-lg px-2 ${
                    item.type === 'income' ? 'bg-green-50/50' : 'bg-red-50/30'
                  }`}
                >
                  <div className="flex flex-col items-center shrink-0 w-12">
                    <span className="text-xs text-gray-400">
                      {new Date(item.date).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {item.companyName}
                    </p>
                    <p className="text-xs text-gray-400 truncate">{item.description}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span
                      className={`text-sm font-bold ${
                        item.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {item.type === 'income' ? '+' : '-'}
                      {formatYen(item.amount)}
                    </span>
                    <div className="mt-0.5">
                      <span
                        className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${
                          item.type === 'income'
                            ? 'bg-green-50 text-green-700'
                            : 'bg-red-50 text-red-700'
                        }`}
                      >
                        {item.type === 'income' ? '入金' : '出金'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {/* 合計 */}
            <div className="mt-4 pt-3 border-t border-gray-200 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">入金合計</span>
                <span className="font-bold text-green-600">+{formatYen(totalIncome)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">出金合計</span>
                <span className="font-bold text-red-600">-{formatYen(totalExpense)}</span>
              </div>
              <div className="flex justify-between text-sm pt-1 border-t border-gray-100">
                <span className="text-gray-700 font-medium">差引</span>
                <span
                  className={`font-bold ${
                    totalIncome - totalExpense >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {totalIncome - totalExpense >= 0 ? '+' : ''}
                  {formatYen(totalIncome - totalExpense)}
                </span>
              </div>
            </div>
          </div>

          {/* 未収金一覧 */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-900">未収金一覧</h2>
              <span className="text-xs text-gray-400">
                合計 {formatYen(mockAccountsReceivable.reduce((s, a) => s + a.amount, 0))}
              </span>
            </div>
            <div className="overflow-x-auto max-h-80">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-gray-500 border-b border-gray-200">
                    <th className="pb-2 font-medium">請求番号</th>
                    <th className="pb-2 font-medium">取引先</th>
                    <th className="pb-2 font-medium text-right">金額</th>
                    <th className="pb-2 font-medium text-right">経過日数</th>
                    <th className="pb-2 font-medium text-center">状態</th>
                  </tr>
                </thead>
                <tbody>
                  {mockAccountsReceivable.map((ar) => (
                    <tr
                      key={ar.id}
                      className={`border-b border-gray-50 ${
                        ar.status === 'critical'
                          ? 'bg-red-50/60 border-l-4 border-l-red-400'
                          : ar.status === 'overdue'
                          ? 'bg-amber-50/40 border-l-4 border-l-amber-400'
                          : ''
                      }`}
                    >
                      <td className="py-2.5 text-gray-600 font-mono">{ar.invoiceNumber}</td>
                      <td className="py-2.5 text-gray-900 font-medium max-w-24 truncate">
                        {ar.clientName}
                      </td>
                      <td className="py-2.5 text-right text-gray-900 font-medium">
                        {formatYen(ar.amount)}
                      </td>
                      <td className="py-2.5 text-right">
                        {ar.daysPastDue > 0 ? (
                          <span
                            className={`font-medium ${
                              ar.daysPastDue > 14 ? 'text-red-600' : 'text-amber-600'
                            }`}
                          >
                            {ar.daysPastDue}日
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="py-2.5 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                            ar.status === 'critical'
                              ? 'bg-red-100 text-red-800'
                              : ar.status === 'overdue'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {ar.status === 'critical'
                            ? '要督促'
                            : ar.status === 'overdue'
                            ? '期限超過'
                            : '正常'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 最近の仕訳 */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">最近の仕訳</h2>
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {mockJournalEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0"
                >
                  <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                    <FileText className="w-3.5 h-3.5 text-gray-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-gray-900 truncate">
                      {entry.description}
                    </p>
                    <p className="text-[10px] text-gray-400">
                      {entry.date} / {entry.account}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    {entry.debit > 0 ? (
                      <div>
                        <span className="text-xs text-gray-400">借方</span>
                        <p className="text-xs font-bold text-blue-600">
                          {formatYen(entry.debit)}
                        </p>
                      </div>
                    ) : (
                      <div>
                        <span className="text-xs text-gray-400">貸方</span>
                        <p className="text-xs font-bold text-emerald-600">
                          {formatYen(entry.credit)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Row 4: 損益推移テーブル (Full width) ── */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">損益推移テーブル</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b-2 border-gray-200">
                  <th className="pb-3 font-semibold text-gray-700">月</th>
                  <th className="pb-3 font-semibold text-gray-700 text-right">売上高</th>
                  <th className="pb-3 font-semibold text-gray-700 text-right">売上原価</th>
                  <th className="pb-3 font-semibold text-gray-700 text-right">粗利</th>
                  <th className="pb-3 font-semibold text-gray-700 text-right">粗利率</th>
                  <th className="pb-3 font-semibold text-gray-700 text-right">販管費</th>
                  <th className="pb-3 font-semibold text-gray-700 text-right">営業利益</th>
                  <th className="pb-3 font-semibold text-gray-700 text-right">営業利益率</th>
                </tr>
              </thead>
              <tbody>
                {mockPLSummary.map((row, i) => {
                  const gm = ((row.gross_profit / row.revenue) * 100).toFixed(1)
                  const om = ((row.operating_income / row.revenue) * 100).toFixed(1)
                  return (
                    <tr
                      key={row.month}
                      className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                        i % 2 === 0 ? 'bg-gray-50/30' : ''
                      }`}
                    >
                      <td className="py-3 text-gray-900 font-medium">{row.month}</td>
                      <td className="py-3 text-right text-gray-900">{formatYen(row.revenue)}</td>
                      <td className="py-3 text-right text-gray-600">
                        {formatYen(row.cost_of_sales)}
                      </td>
                      <td className="py-3 text-right text-green-600 font-medium">
                        {formatYen(row.gross_profit)}
                      </td>
                      <td className="py-3 text-right text-gray-500">{gm}%</td>
                      <td className="py-3 text-right text-gray-600">
                        {formatYen(row.operating_expenses)}
                      </td>
                      <td
                        className={`py-3 text-right font-bold ${
                          row.operating_income >= 0 ? 'text-emerald-600' : 'text-red-600'
                        }`}
                      >
                        {formatYen(row.operating_income)}
                      </td>
                      <td
                        className={`py-3 text-right font-medium ${
                          row.operating_income >= 0 ? 'text-emerald-600' : 'text-red-600'
                        }`}
                      >
                        {om}%
                      </td>
                    </tr>
                  )
                })}
                {/* 合計行 */}
                <tr className="border-t-2 border-gray-300 bg-gray-50 font-bold">
                  <td className="py-3 text-gray-900">合計</td>
                  <td className="py-3 text-right text-gray-900">
                    {formatYen(plTotals.revenue)}
                  </td>
                  <td className="py-3 text-right text-gray-700">
                    {formatYen(plTotals.cost_of_sales)}
                  </td>
                  <td className="py-3 text-right text-green-600">
                    {formatYen(plTotals.gross_profit)}
                  </td>
                  <td className="py-3 text-right text-gray-500">
                    {((plTotals.gross_profit / plTotals.revenue) * 100).toFixed(1)}%
                  </td>
                  <td className="py-3 text-right text-gray-700">
                    {formatYen(plTotals.operating_expenses)}
                  </td>
                  <td
                    className={`py-3 text-right ${
                      plTotals.operating_income >= 0 ? 'text-emerald-600' : 'text-red-600'
                    }`}
                  >
                    {formatYen(plTotals.operating_income)}
                  </td>
                  <td
                    className={`py-3 text-right ${
                      plTotals.operating_income >= 0 ? 'text-emerald-600' : 'text-red-600'
                    }`}
                  >
                    {((plTotals.operating_income / plTotals.revenue) * 100).toFixed(1)}%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  )
}
