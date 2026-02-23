import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from 'recharts'
import { Layout } from '../components/Layout'
import { StatusBadge } from '../components/StatusBadge'
import {
  mockOvertimeRanking,
  mockAttendance,
  mockLeaveBalances,
} from '../lib/mockData'

export function HR() {
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">人事・労務</h1>
          <p className="text-gray-500 mt-1">勤怠状況・残業管理・有給管理</p>
        </div>

        {/* 36協定アラート */}
        {mockOvertimeRanking.some((e) => e.hours > 36) && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <h3 className="text-red-800 font-bold text-sm">36協定超過アラート</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {mockOvertimeRanking
                .filter((e) => e.hours > 36)
                .map((e) => (
                  <span key={e.name} className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                    {e.name}（{e.hours}h）
                  </span>
                ))}
            </div>
          </div>
        )}

        {/* 残業ランキング */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">今月の残業時間ランキング</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockOvertimeRanking} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 12 }} unit="h" />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 13 }} width={100} />
                <Tooltip
                  formatter={(value) => [`${value}時間`, '残業時間']}
                />
                <ReferenceLine x={36} stroke="#ef4444" strokeWidth={2} strokeDasharray="5 5" label={{ value: '36h上限', fill: '#ef4444', fontSize: 12 }} />
                <Bar dataKey="hours" name="残業時間" radius={[0, 4, 4, 0]}>
                  {mockOvertimeRanking.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={entry.hours > 36 ? '#ef4444' : entry.hours > 25 ? '#f97316' : '#2563eb'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 勤怠テーブル */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">本日の勤怠状況</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-200">
                  <th className="pb-3 font-medium">氏名</th>
                  <th className="pb-3 font-medium text-center">出勤</th>
                  <th className="pb-3 font-medium text-center">退勤</th>
                  <th className="pb-3 font-medium text-right">残業</th>
                  <th className="pb-3 font-medium text-center">ステータス</th>
                </tr>
              </thead>
              <tbody>
                {mockAttendance.map((att, i) => (
                  <tr key={att.id} className={`border-b border-gray-100 ${i % 2 === 0 ? 'bg-gray-50/50' : ''}`}>
                    <td className="py-3 text-gray-900 font-medium">{att.employee_name}</td>
                    <td className="py-3 text-center text-gray-600">{att.clock_in ?? '-'}</td>
                    <td className="py-3 text-center text-gray-600">{att.clock_out ?? '-'}</td>
                    <td className="py-3 text-right">
                      {att.overtime_hours > 0 ? (
                        <span className={att.overtime_hours >= 3 ? 'text-red-600 font-bold' : 'text-gray-900'}>
                          {att.overtime_hours}h
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="py-3 text-center"><StatusBadge status={att.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 有給残高 */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">有給休暇残高</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-200">
                  <th className="pb-3 font-medium">氏名</th>
                  <th className="pb-3 font-medium">部署</th>
                  <th className="pb-3 font-medium text-right">付与日数</th>
                  <th className="pb-3 font-medium text-right">取得日数</th>
                  <th className="pb-3 font-medium text-right">残日数</th>
                  <th className="pb-3 font-medium text-center">消化率</th>
                </tr>
              </thead>
              <tbody>
                {mockLeaveBalances.map((lb, i) => {
                  const rate = Math.round((lb.used_days / lb.total_days) * 100)
                  return (
                    <tr key={lb.employee_id} className={`border-b border-gray-100 ${i % 2 === 0 ? 'bg-gray-50/50' : ''}`}>
                      <td className="py-3 text-gray-900 font-medium">{lb.employee_name}</td>
                      <td className="py-3 text-gray-600">{lb.department}</td>
                      <td className="py-3 text-right text-gray-900">{lb.total_days}日</td>
                      <td className="py-3 text-right text-gray-900">{lb.used_days}日</td>
                      <td className="py-3 text-right">
                        <span className={lb.remaining_days <= 3 ? 'text-red-600 font-bold' : 'text-gray-900'}>
                          {lb.remaining_days}日
                        </span>
                      </td>
                      <td className="py-3 text-center">
                        <div className="flex items-center gap-2 justify-center">
                          <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${rate >= 50 ? 'bg-green-500' : rate >= 25 ? 'bg-yellow-500' : 'bg-red-500'}`}
                              style={{ width: `${rate}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500">{rate}%</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  )
}
