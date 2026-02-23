import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
  Cell,
  PieChart,
  Pie,
} from 'recharts'
import { Layout } from '../components/Layout'
import {
  Users,
  Clock,
  CalendarCheck,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  AlertCircle,
} from 'lucide-react'
import {
  mockOvertimeRanking,
  mockAttendance,
  mockLeaveBalances,
  mockEmployees,
  mockMonthlyOvertime,
  mockDepartmentOvertime,
  mockMonthlyAttendanceSummary,
} from '../lib/mockData'

// 部署カラーマップ
const deptColors: Record<string, string> = {
  '営業部': '#2563eb',
  '開発部': '#7c3aed',
  '経理部': '#0891b2',
  '人事部': '#16a34a',
  '総務部': '#f59e0b',
}

const deptBgColors: Record<string, string> = {
  '営業部': 'bg-blue-500',
  '開発部': 'bg-violet-500',
  '経理部': 'bg-cyan-600',
  '人事部': 'bg-green-500',
  '総務部': 'bg-amber-500',
}

// ステータスバッジ定義
const statusConfig: Record<string, { label: string; bg: string; text: string }> = {
  normal: { label: '出勤中', bg: 'bg-green-100', text: 'text-green-800' },
  late: { label: '遅刻', bg: 'bg-amber-100', text: 'text-amber-800' },
  absent: { label: '欠勤', bg: 'bg-red-100', text: 'text-red-800' },
  paid_leave: { label: '有給', bg: 'bg-blue-100', text: 'text-blue-800' },
  holiday: { label: '休日', bg: 'bg-purple-100', text: 'text-purple-800' },
}

export function HR() {
  // 在籍人数（active + on_leave）
  const activeCount = mockEmployees.filter(
    (e) => e.status === 'active' || e.status === 'on_leave'
  ).length

  // 部署別人数
  const deptBreakdown = mockEmployees
    .filter((e) => e.status === 'active' || e.status === 'on_leave')
    .reduce<Record<string, number>>((acc, e) => {
      acc[e.department] = (acc[e.department] || 0) + 1
      return acc
    }, {})

  // 今月の平均残業
  const avgOvertime =
    mockOvertimeRanking.reduce((sum, e) => sum + e.hours, 0) / mockOvertimeRanking.length
  const prevAvgOvertime = 20.0 // 前月比較用

  // 有給取得率
  const totalGranted = mockLeaveBalances.reduce((sum, lb) => sum + lb.total_days, 0)
  const totalUsed = mockLeaveBalances.reduce((sum, lb) => sum + lb.used_days, 0)
  const leaveRate = ((totalUsed / totalGranted) * 100).toFixed(1)

  // 36協定違反者
  const violators = mockOvertimeRanking.filter((e) => e.hours > 36)

  // 退勤済み判定用
  const getDisplayStatus = (att: typeof mockAttendance[0]) => {
    if (att.status === 'paid_leave' || att.status === 'absent') return att.status
    if (att.clock_out) return 'clocked_out'
    if (att.status === 'late') return 'late'
    return 'normal'
  }

  // ソート: アラート優先 → 出勤時間順
  const sortedAttendance = [...mockAttendance].sort((a, b) => {
    const priority: Record<string, number> = {
      late: 0,
      absent: 1,
      normal: 2,
      paid_leave: 3,
      holiday: 4,
    }
    const pa = priority[a.status] ?? 99
    const pb = priority[b.status] ?? 99
    if (pa !== pb) return pa - pb
    return (a.clock_in ?? 'zzz').localeCompare(b.clock_in ?? 'zzz')
  })

  // 部署別残業フラットデータ（横棒グラフ用）
  const deptOvertimeFlat = mockDepartmentOvertime.flatMap((dept) =>
    dept.employees.map((emp) => ({
      name: emp.name,
      department: dept.department,
      hours: emp.hours,
      fill: deptColors[dept.department] || '#6b7280',
    }))
  )

  // イニシャル取得
  const getInitials = (name: string) => {
    const parts = name.split(/\s+/)
    return parts.length >= 2 ? parts[0][0] + parts[1][0] : name.slice(0, 2)
  }

  // 従業員部署取得
  const getDepartment = (name: string) => {
    const emp = mockEmployees.find((e) => e.name === name)
    return emp?.department || ''
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* ── ヘッダー ── */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">人事・労務</h1>
          <p className="text-gray-500 mt-1 text-sm">勤怠管理・残業監視・有給管理</p>
        </div>

        {/* ── Summary stat cards (4枚) ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 在籍人数 */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                在籍人数
              </span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                <Users className="w-4 h-4 text-blue-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {activeCount}
              <span className="text-base font-normal text-gray-400 ml-1">名</span>
            </p>
            {/* 部署別ミニバー */}
            <div className="flex gap-0.5 mt-3 h-2 rounded-full overflow-hidden">
              {Object.entries(deptBreakdown).map(([dept, count]) => (
                <div
                  key={dept}
                  className={`${deptBgColors[dept] || 'bg-gray-400'}`}
                  style={{ width: `${(count / activeCount) * 100}%` }}
                  title={`${dept}: ${count}名`}
                />
              ))}
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
              {Object.entries(deptBreakdown).map(([dept, count]) => (
                <span key={dept} className="text-[10px] text-gray-400">
                  {dept} {count}
                </span>
              ))}
            </div>
          </div>

          {/* 平均残業 */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                今月の平均残業
              </span>
              <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
                <Clock className="w-4 h-4 text-orange-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {avgOvertime.toFixed(1)}
              <span className="text-base font-normal text-gray-400 ml-1">h</span>
            </p>
            <div className="flex items-center gap-1 mt-2">
              {avgOvertime < prevAvgOvertime ? (
                <>
                  <TrendingDown className="w-3.5 h-3.5 text-green-500" />
                  <span className="text-xs font-medium text-green-600">
                    -{(prevAvgOvertime - avgOvertime).toFixed(1)}h vs前月
                  </span>
                </>
              ) : (
                <>
                  <TrendingUp className="w-3.5 h-3.5 text-red-500" />
                  <span className="text-xs font-medium text-red-600">
                    +{(avgOvertime - prevAvgOvertime).toFixed(1)}h vs前月
                  </span>
                </>
              )}
            </div>
          </div>

          {/* 有給取得率 */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                有給取得率
              </span>
              <div className="w-8 h-8 rounded-lg bg-cyan-50 flex items-center justify-center">
                <CalendarCheck className="w-4 h-4 text-cyan-600" />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <p className="text-3xl font-bold text-gray-900">
                {leaveRate}
                <span className="text-base font-normal text-gray-400 ml-0.5">%</span>
              </p>
              {/* ミニドーナツ */}
              <div className="w-14 h-14">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { value: parseFloat(leaveRate) },
                        { value: 100 - parseFloat(leaveRate) },
                      ]}
                      dataKey="value"
                      cx="50%"
                      cy="50%"
                      innerRadius={16}
                      outerRadius={24}
                      startAngle={90}
                      endAngle={-270}
                      paddingAngle={0}
                    >
                      <Cell fill="#0891b2" />
                      <Cell fill="#e5e7eb" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            <p className="text-[10px] text-gray-400 mt-1">
              {totalUsed}日取得 / {totalGranted}日付与
            </p>
          </div>

          {/* 36協定違反 */}
          <div
            className={`rounded-xl border shadow-sm p-5 ${
              violators.length > 0
                ? 'bg-red-50 border-red-200'
                : 'bg-white border-gray-100'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                36協定超過
              </span>
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  violators.length > 0 ? 'bg-red-100' : 'bg-green-50'
                }`}
              >
                <AlertTriangle
                  className={`w-4 h-4 ${
                    violators.length > 0 ? 'text-red-600' : 'text-green-600'
                  }`}
                />
              </div>
            </div>
            <p
              className={`text-3xl font-bold ${
                violators.length > 0 ? 'text-red-600' : 'text-green-600'
              }`}
            >
              {violators.length}
              <span className="text-base font-normal text-gray-400 ml-1">名</span>
            </p>
            {violators.length > 0 && (
              <div className="mt-2 space-y-0.5">
                {violators.map((v) => (
                  <p key={v.name} className="text-xs text-red-700 font-medium">
                    {v.name}（{v.hours}h）
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── 36協定超過アラートバナー ── */}
        {violators.length > 0 && (
          <div className="bg-gradient-to-r from-red-50 to-amber-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0 mt-0.5">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-red-800 font-bold text-sm">36協定超過警告</h3>
                <p className="text-red-700 text-sm mt-1">
                  {violators.map((v) => `${v.name}(${v.hours}h)`).join('、')} - 速やかに対応が必要です
                </p>
                <p className="text-red-500 text-xs mt-1">
                  時間外労働の上限は原則月36時間です。労基署への届出と是正対応を検討してください。
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── Row 1: 残業時間推移 + 部署別残業分布 ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 残業時間推移 */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-base font-bold text-gray-900 mb-4">残業時間推移（12ヶ月）</h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mockMonthlyOvertime} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <defs>
                    <linearGradient id="overtimeGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
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
                    axisLine={false}
                    tickLine={false}
                    domain={[0, 55]}
                    unit="h"
                  />
                  <Tooltip
                    formatter={(value) => [`${value}h`]}
                    contentStyle={{
                      borderRadius: '12px',
                      border: '1px solid #e5e7eb',
                      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                      fontSize: '13px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                  <ReferenceLine
                    y={36}
                    stroke="#ef4444"
                    strokeWidth={1.5}
                    strokeDasharray="6 4"
                    label={{
                      value: '36h上限',
                      fill: '#ef4444',
                      fontSize: 11,
                      position: 'right',
                    }}
                  />
                  <ReferenceLine
                    y={45}
                    stroke="#dc2626"
                    strokeWidth={1.5}
                    strokeDasharray="3 3"
                    label={{
                      value: '45h特別',
                      fill: '#dc2626',
                      fontSize: 11,
                      position: 'right',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="average"
                    name="平均残業"
                    fill="url(#overtimeGradient)"
                    stroke="#f97316"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="max"
                    name="最大残業"
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth={1.5}
                    strokeDasharray="4 2"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 部署別残業分布 */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-base font-bold text-gray-900 mb-4">部署別残業分布</h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={deptOvertimeFlat}
                  layout="vertical"
                  margin={{ left: 10, right: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11, fill: '#9ca3af' }}
                    unit="h"
                    axisLine={false}
                    tickLine={false}
                    domain={[0, 50]}
                  />
                  <YAxis
                    dataKey="name"
                    type="category"
                    tick={{ fontSize: 12, fill: '#374151' }}
                    width={90}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(value) => [`${value}h`, '残業時間']}
                    contentStyle={{
                      borderRadius: '12px',
                      border: '1px solid #e5e7eb',
                      fontSize: '13px',
                    }}
                  />
                  <ReferenceLine
                    x={36}
                    stroke="#ef4444"
                    strokeWidth={1.5}
                    strokeDasharray="5 3"
                    label={{
                      value: '36h',
                      fill: '#ef4444',
                      fontSize: 10,
                      position: 'top',
                    }}
                  />
                  <Bar dataKey="hours" radius={[0, 6, 6, 0]} barSize={16}>
                    {deptOvertimeFlat.map((entry, index) => (
                      <Cell
                        key={index}
                        fill={entry.hours > 36 ? '#ef4444' : entry.fill}
                        fillOpacity={entry.hours > 36 ? 1 : 0.8}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            {/* 凡例 */}
            <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-gray-100">
              {Object.entries(deptColors).map(([dept, color]) => (
                <div key={dept} className="flex items-center gap-1.5">
                  <div
                    className="w-3 h-3 rounded-sm"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-xs text-gray-500">{dept}</span>
                </div>
              ))}
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-red-500" />
                <span className="text-xs text-red-500">36h超過</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Row 2: 本日の出退勤状況 ── */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-base font-bold text-gray-900 mb-4">本日の出退勤状況</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b-2 border-gray-200">
                  <th className="pb-3 font-semibold text-gray-700">氏名</th>
                  <th className="pb-3 font-semibold text-gray-700">部署</th>
                  <th className="pb-3 font-semibold text-gray-700 text-center">出勤時刻</th>
                  <th className="pb-3 font-semibold text-gray-700 text-center">退勤時刻</th>
                  <th className="pb-3 font-semibold text-gray-700 text-center">実働時間</th>
                  <th className="pb-3 font-semibold text-gray-700 text-right">残業</th>
                  <th className="pb-3 font-semibold text-gray-700 text-center">ステータス</th>
                </tr>
              </thead>
              <tbody>
                {sortedAttendance.map((att, i) => {
                  const dept = getDepartment(att.employee_name)
                  const displayStatus = getDisplayStatus(att)

                  // 実働時間計算
                  let workHours = '-'
                  if (att.clock_in && att.clock_out) {
                    const [inH, inM] = att.clock_in.split(':').map(Number)
                    const [outH, outM] = att.clock_out.split(':').map(Number)
                    const totalMin = (outH * 60 + outM) - (inH * 60 + inM) - 60 // 休憩1h差引
                    const h = Math.floor(totalMin / 60)
                    const m = totalMin % 60
                    workHours = `${h}h${m > 0 ? `${m}m` : ''}`
                  }

                  return (
                    <tr
                      key={att.id}
                      className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                        i % 2 === 0 ? 'bg-gray-50/30' : ''
                      }`}
                    >
                      <td className="py-3">
                        <div className="flex items-center gap-3">
                          {/* アバター */}
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${
                              deptBgColors[dept] || 'bg-gray-400'
                            }`}
                          >
                            {getInitials(att.employee_name)}
                          </div>
                          <span className="font-medium text-gray-900">{att.employee_name}</span>
                        </div>
                      </td>
                      <td className="py-3">
                        <span className="text-xs text-gray-500 px-2 py-0.5 bg-gray-100 rounded">
                          {dept}
                        </span>
                      </td>
                      <td className="py-3 text-center text-gray-600 font-mono text-xs">
                        {att.clock_in ?? '-'}
                      </td>
                      <td className="py-3 text-center text-gray-600 font-mono text-xs">
                        {att.clock_out ?? '-'}
                      </td>
                      <td className="py-3 text-center text-gray-700 font-medium text-xs">
                        {workHours}
                      </td>
                      <td className="py-3 text-right">
                        {att.overtime_hours > 0 ? (
                          <span
                            className={`font-bold ${
                              att.overtime_hours >= 3 ? 'text-red-600' : 'text-orange-600'
                            }`}
                          >
                            {att.overtime_hours}h
                          </span>
                        ) : (
                          <span className="text-gray-300">-</span>
                        )}
                      </td>
                      <td className="py-3 text-center">
                        {displayStatus === 'clocked_out' ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                            退勤済
                          </span>
                        ) : (
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              (statusConfig[att.status]?.bg || 'bg-gray-100')
                            } ${statusConfig[att.status]?.text || 'text-gray-600'}`}
                          >
                            {statusConfig[att.status]?.label || att.status}
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Row 3: 有給休暇管理 + 勤怠サマリー ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 有給休暇管理 */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-base font-bold text-gray-900 mb-4">有給休暇管理</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b-2 border-gray-200">
                    <th className="pb-3 font-semibold text-gray-700">氏名</th>
                    <th className="pb-3 font-semibold text-gray-700">部署</th>
                    <th className="pb-3 font-semibold text-gray-700 text-right">付与</th>
                    <th className="pb-3 font-semibold text-gray-700 text-right">取得</th>
                    <th className="pb-3 font-semibold text-gray-700 text-right">残</th>
                    <th className="pb-3 font-semibold text-gray-700 w-36">消化率</th>
                  </tr>
                </thead>
                <tbody>
                  {mockLeaveBalances.map((lb, i) => {
                    const rate = Math.round((lb.used_days / lb.total_days) * 100)
                    const barColor =
                      rate >= 50 ? 'bg-green-500' : rate >= 20 ? 'bg-amber-500' : 'bg-red-500'
                    return (
                      <tr
                        key={lb.employee_id}
                        className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                          i % 2 === 0 ? 'bg-gray-50/30' : ''
                        }`}
                      >
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            {lb.remaining_days === 0 && (
                              <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                            )}
                            <span className="font-medium text-gray-900">{lb.employee_name}</span>
                          </div>
                        </td>
                        <td className="py-3">
                          <span className="text-xs text-gray-500 px-2 py-0.5 bg-gray-100 rounded">
                            {lb.department}
                          </span>
                        </td>
                        <td className="py-3 text-right text-gray-700">{lb.total_days}日</td>
                        <td className="py-3 text-right text-gray-700">{lb.used_days}日</td>
                        <td className="py-3 text-right">
                          <span
                            className={`font-bold ${
                              lb.remaining_days === 0
                                ? 'text-red-600'
                                : lb.remaining_days <= 3
                                ? 'text-amber-600'
                                : 'text-gray-900'
                            }`}
                          >
                            {lb.remaining_days}日
                          </span>
                        </td>
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${barColor}`}
                                style={{ width: `${rate}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-500 w-8 text-right">{rate}%</span>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* 今月の勤怠サマリー */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-base font-bold text-gray-900 mb-4">今月の勤怠サマリー</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {mockMonthlyAttendanceSummary.map((summary) => {
                const dept = summary.department
                const hasAlert =
                  summary.totalOvertime > 36 || summary.lateCount > 2 || summary.absenceCount > 3
                return (
                  <div
                    key={summary.employeeId}
                    className={`rounded-lg border p-4 hover:shadow-sm transition-shadow ${
                      hasAlert ? 'border-red-200 bg-red-50/30' : 'border-gray-100 bg-gray-50/30'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                          deptBgColors[dept] || 'bg-gray-400'
                        }`}
                      >
                        {getInitials(summary.employeeName)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-gray-900 truncate">
                          {summary.employeeName}
                        </p>
                        <p className="text-[10px] text-gray-400">{dept}</p>
                      </div>
                      {hasAlert && (
                        <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="text-center p-1.5 bg-white rounded border border-gray-100">
                        <p className="text-[10px] text-gray-400">出勤日数</p>
                        <p className="text-sm font-bold text-gray-900">{summary.workDays}日</p>
                      </div>
                      <div
                        className={`text-center p-1.5 rounded border ${
                          summary.totalOvertime > 36
                            ? 'bg-red-50 border-red-200'
                            : 'bg-white border-gray-100'
                        }`}
                      >
                        <p className="text-[10px] text-gray-400">残業合計</p>
                        <p
                          className={`text-sm font-bold ${
                            summary.totalOvertime > 36 ? 'text-red-600' : 'text-gray-900'
                          }`}
                        >
                          {summary.totalOvertime}h
                        </p>
                      </div>
                      <div
                        className={`text-center p-1.5 rounded border ${
                          summary.lateCount > 2
                            ? 'bg-amber-50 border-amber-200'
                            : 'bg-white border-gray-100'
                        }`}
                      >
                        <p className="text-[10px] text-gray-400">遅刻</p>
                        <p
                          className={`text-sm font-bold ${
                            summary.lateCount > 2 ? 'text-amber-600' : 'text-gray-900'
                          }`}
                        >
                          {summary.lateCount}回
                        </p>
                      </div>
                      <div
                        className={`text-center p-1.5 rounded border ${
                          summary.absenceCount > 3
                            ? 'bg-red-50 border-red-200'
                            : 'bg-white border-gray-100'
                        }`}
                      >
                        <p className="text-[10px] text-gray-400">欠勤</p>
                        <p
                          className={`text-sm font-bold ${
                            summary.absenceCount > 3 ? 'text-red-600' : 'text-gray-900'
                          }`}
                        >
                          {summary.absenceCount}回
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
