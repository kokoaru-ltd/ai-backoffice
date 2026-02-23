import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { Layout } from '../components/Layout'
import { StatusBadge } from '../components/StatusBadge'
import {
  mockMonthlyRevenue,
  mockExpenses,
  mockInvoices,
  mockPLSummary,
} from '../lib/mockData'

const formatYen = (v: number) => `\u00a5${v.toLocaleString()}`

export function Accounting() {
  const latestPL = mockPLSummary[mockPLSummary.length - 1]

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">経理・会計</h1>
          <p className="text-gray-500 mt-1">売上・経費・損益の確認</p>
        </div>

        {/* PL サマリー */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: '売上高', value: latestPL.revenue, color: 'text-blue-600' },
            { label: '売上原価', value: latestPL.cost_of_sales, color: 'text-gray-600' },
            { label: '売上総利益', value: latestPL.gross_profit, color: 'text-green-600' },
            { label: '販管費', value: latestPL.operating_expenses, color: 'text-orange-600' },
            { label: '営業利益', value: latestPL.operating_income, color: 'text-emerald-600' },
          ].map((item) => (
            <div key={item.label} className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs text-gray-500">{item.label}</p>
              <p className={`text-xl font-bold mt-1 ${item.color}`}>{formatYen(item.value)}</p>
            </div>
          ))}
        </div>

        {/* 売上・経費チャート */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">売上・経費推移</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockMonthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 13 }} />
                <YAxis
                  tick={{ fontSize: 12 }}
                  tickFormatter={(v: number) => `${(v / 1000000).toFixed(0)}M`}
                />
                <Tooltip formatter={(value) => [formatYen(value as number)]} />
                <Legend />
                <Bar dataKey="revenue" name="売上" fill="#2563eb" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" name="経費" fill="#f97316" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* テーブル2列 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 経費一覧 */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">最近の経費</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b border-gray-200">
                    <th className="pb-3 font-medium">申請者</th>
                    <th className="pb-3 font-medium">内容</th>
                    <th className="pb-3 font-medium text-right">金額</th>
                    <th className="pb-3 font-medium text-center">ステータス</th>
                  </tr>
                </thead>
                <tbody>
                  {mockExpenses.map((expense, i) => (
                    <tr key={expense.id} className={`border-b border-gray-100 ${i % 2 === 0 ? 'bg-gray-50/50' : ''}`}>
                      <td className="py-3 text-gray-900">{expense.employee_name}</td>
                      <td className="py-3 text-gray-600 max-w-48 truncate">{expense.description}</td>
                      <td className="py-3 text-gray-900 text-right font-medium">{formatYen(expense.amount)}</td>
                      <td className="py-3 text-center"><StatusBadge status={expense.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 請求書一覧 */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">最近の請求書</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b border-gray-200">
                    <th className="pb-3 font-medium">番号</th>
                    <th className="pb-3 font-medium">顧客</th>
                    <th className="pb-3 font-medium text-right">金額</th>
                    <th className="pb-3 font-medium text-center">ステータス</th>
                  </tr>
                </thead>
                <tbody>
                  {mockInvoices.map((inv, i) => (
                    <tr key={inv.id} className={`border-b border-gray-100 ${i % 2 === 0 ? 'bg-gray-50/50' : ''}`}>
                      <td className="py-3 text-gray-600 font-mono text-xs">{inv.invoice_number}</td>
                      <td className="py-3 text-gray-900 truncate max-w-36">{inv.client_name}</td>
                      <td className="py-3 text-gray-900 text-right font-medium">{formatYen(inv.total_amount)}</td>
                      <td className="py-3 text-center"><StatusBadge status={inv.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* PL推移テーブル */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">損益推移</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-200">
                  <th className="pb-3 font-medium">月</th>
                  <th className="pb-3 font-medium text-right">売上高</th>
                  <th className="pb-3 font-medium text-right">売上原価</th>
                  <th className="pb-3 font-medium text-right">売上総利益</th>
                  <th className="pb-3 font-medium text-right">販管費</th>
                  <th className="pb-3 font-medium text-right">営業利益</th>
                </tr>
              </thead>
              <tbody>
                {mockPLSummary.map((row, i) => (
                  <tr key={row.month} className={`border-b border-gray-100 ${i % 2 === 0 ? 'bg-gray-50/50' : ''}`}>
                    <td className="py-3 text-gray-900 font-medium">{row.month}</td>
                    <td className="py-3 text-right text-gray-900">{formatYen(row.revenue)}</td>
                    <td className="py-3 text-right text-gray-600">{formatYen(row.cost_of_sales)}</td>
                    <td className="py-3 text-right text-green-600 font-medium">{formatYen(row.gross_profit)}</td>
                    <td className="py-3 text-right text-gray-600">{formatYen(row.operating_expenses)}</td>
                    <td className="py-3 text-right text-emerald-600 font-bold">{formatYen(row.operating_income)}</td>
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
