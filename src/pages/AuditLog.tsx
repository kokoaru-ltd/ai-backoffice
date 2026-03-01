import { useState } from 'react'
import {
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronRight,
  Activity,
  Shield,
  Clock,
  Zap,
} from 'lucide-react'
import { Layout } from '../components/Layout'
import { mockAuditLogsExtended } from '../lib/mockData'

const domains = ['all', 'accounting', 'hr', 'crm', 'documents', 'general'] as const
const domainLabels: Record<string, string> = {
  all: 'すべて',
  accounting: '経理',
  hr: '人事',
  crm: '営業',
  documents: 'ドキュメント',
  general: '総務',
}

const domainColors: Record<string, { bg: string; text: string; dot: string }> = {
  accounting: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  hr: { bg: 'bg-violet-50', text: 'text-violet-700', dot: 'bg-violet-500' },
  crm: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  documents: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  general: { bg: 'bg-rose-50', text: 'text-rose-700', dot: 'bg-rose-500' },
}

const dateRanges = [
  { key: 'today', label: '今日' },
  { key: 'yesterday', label: '昨日' },
  { key: 'week', label: '今週' },
  { key: 'month', label: '今月' },
] as const

export function AuditLog() {
  const [selectedDomain, setSelectedDomain] = useState<string>('all')
  const [selectedDateRange, setSelectedDateRange] = useState<string>('today')
  const [showSuccessOnly, setShowSuccessOnly] = useState<boolean | null>(null) // null = all
  const [expandedRow, setExpandedRow] = useState<string | null>(null)

  // Filter logs
  const filteredLogs = mockAuditLogsExtended.filter((log) => {
    if (selectedDomain !== 'all' && log.domain !== selectedDomain) return false
    if (showSuccessOnly === true && !log.success) return false
    if (showSuccessOnly === false && log.success) return false

    // Date range filter
    if (selectedDateRange === 'today') {
      return log.timestamp.startsWith('2026-02-23')
    }
    if (selectedDateRange === 'yesterday') {
      return log.timestamp.startsWith('2026-02-22')
    }
    if (selectedDateRange === 'week') {
      return log.timestamp >= '2026-02-17' && log.timestamp <= '2026-02-23'
    }
    return true // month: show all
  })

  // Stats
  const totalOps = mockAuditLogsExtended.length
  const successCount = mockAuditLogsExtended.filter(l => l.success).length
  const successRate = Math.round((successCount / totalOps) * 1000) / 10
  const todayOps = mockAuditLogsExtended.filter(l => l.timestamp.startsWith('2026-02-23')).length
  const domainCounts: Record<string, number> = {}
  mockAuditLogsExtended.forEach(l => {
    domainCounts[l.domain] = (domainCounts[l.domain] || 0) + 1
  })
  const mostUsedDomain = Object.entries(domainCounts).sort((a, b) => b[1] - a[1])[0]

  return (
    <Layout>
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI操作ログ</h1>
          <p className="text-gray-500 mt-1">AIが実行した操作の履歴を確認</p>
        </div>

        {/* ── Stats Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <Activity className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{totalOps}</p>
                <p className="text-xs text-gray-500">総操作数</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                <Shield className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{successRate}%</p>
                <p className="text-xs text-gray-500">成功率</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                <Clock className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{todayOps}</p>
                <p className="text-xs text-gray-500">今日の操作数</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
                <Zap className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{domainLabels[mostUsedDomain?.[0] ?? '']}</p>
                <p className="text-xs text-gray-500">最多ドメイン ({mostUsedDomain?.[1]}件)</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Filters ── */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Domain filters */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium text-gray-500 mr-1">ドメイン:</span>
              {domains.map((domain) => (
                <button
                  key={domain}
                  onClick={() => setSelectedDomain(domain)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    selectedDomain === domain
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {domainLabels[domain]}
                </button>
              ))}
            </div>

            <div className="w-px h-6 bg-gray-200" />

            {/* Date range */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium text-gray-500 mr-1">期間:</span>
              {dateRanges.map((range) => (
                <button
                  key={range.key}
                  onClick={() => setSelectedDateRange(range.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    selectedDateRange === range.key
                      ? 'bg-gray-900 text-white shadow-sm'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>

            <div className="w-px h-6 bg-gray-200" />

            {/* Success/Failure toggle */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium text-gray-500 mr-1">結果:</span>
              <button
                onClick={() => setShowSuccessOnly(showSuccessOnly === null ? true : showSuccessOnly === true ? false : null)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 ${
                  showSuccessOnly === null
                    ? 'bg-gray-50 text-gray-600'
                    : showSuccessOnly
                    ? 'bg-green-50 text-green-700'
                    : 'bg-red-50 text-red-700'
                }`}
              >
                {showSuccessOnly === null ? (
                  'すべて'
                ) : showSuccessOnly ? (
                  <>
                    <CheckCircle2 className="w-3 h-3" />
                    成功のみ
                  </>
                ) : (
                  <>
                    <XCircle className="w-3 h-3" />
                    失敗のみ
                  </>
                )}
              </button>
            </div>

            {/* Results count */}
            <span className="ml-auto text-xs text-gray-400">{filteredLogs.length}件表示</span>
          </div>
        </div>

        {/* ── Main Table ── */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="pb-3 text-left font-semibold text-gray-500 text-xs uppercase tracking-wider w-8"></th>
                  <th className="pb-3 text-left font-semibold text-gray-500 text-xs uppercase tracking-wider">タイムスタンプ</th>
                  <th className="pb-3 text-left font-semibold text-gray-500 text-xs uppercase tracking-wider">ユーザー</th>
                  <th className="pb-3 text-center font-semibold text-gray-500 text-xs uppercase tracking-wider">ドメイン</th>
                  <th className="pb-3 text-left font-semibold text-gray-500 text-xs uppercase tracking-wider">操作</th>
                  <th className="pb-3 text-left font-semibold text-gray-500 text-xs uppercase tracking-wider">処理内容</th>
                  <th className="pb-3 text-center font-semibold text-gray-500 text-xs uppercase tracking-wider">結果</th>
                  <th className="pb-3 text-right font-semibold text-gray-500 text-xs uppercase tracking-wider">処理時間</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log, i) => {
                  const domainColor = domainColors[log.domain]
                  const isExpanded = expandedRow === log.id
                  return (
                    <>
                      <tr
                        key={log.id}
                        className={`border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer ${i % 2 === 0 ? 'bg-gray-50/30' : ''}`}
                        onClick={() => setExpandedRow(isExpanded ? null : log.id)}
                      >
                        <td className="py-3.5 pl-2">
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                          )}
                        </td>
                        <td className="py-3.5 text-xs text-gray-500 whitespace-nowrap font-mono">
                          {log.timestamp}
                        </td>
                        <td className="py-3.5">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shrink-0">
                              <span className="text-[10px] text-white font-bold">{log.userAvatar}</span>
                            </div>
                            <span className="text-gray-900 font-medium whitespace-nowrap">{log.userName}</span>
                          </div>
                        </td>
                        <td className="py-3.5 text-center">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${domainColor?.bg} ${domainColor?.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${domainColor?.dot}`} />
                            {domainLabels[log.domain]}
                          </span>
                        </td>
                        <td className="py-3.5 text-gray-700 font-medium">{log.action}</td>
                        <td className="py-3.5 text-gray-600 max-w-64 truncate">{log.detail}</td>
                        <td className="py-3.5 text-center">
                          {log.success ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              成功
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700">
                              <XCircle className="w-3.5 h-3.5" />
                              失敗
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 text-right">
                          <span className={`text-xs font-mono ${log.processingTime > 5000 ? 'text-amber-600' : 'text-gray-500'}`}>
                            {log.processingTime >= 1000
                              ? `${(log.processingTime / 1000).toFixed(1)}s`
                              : `${log.processingTime}ms`
                            }
                          </span>
                        </td>
                      </tr>

                      {/* Expanded row with JSON payloads */}
                      {isExpanded && (
                        <tr key={`${log.id}-detail`} className="bg-gray-50/50">
                          <td colSpan={8} className="py-4 px-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* Request payload */}
                              <div className="bg-white rounded-lg border border-gray-200 p-4">
                                <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Request</p>
                                <pre className="text-xs text-gray-700 bg-gray-50 rounded-lg p-3 overflow-x-auto font-mono leading-relaxed">
                                  {log.requestPayload
                                    ? JSON.stringify(JSON.parse(log.requestPayload), null, 2)
                                    : 'N/A'
                                  }
                                </pre>
                              </div>
                              {/* Response payload */}
                              <div className="bg-white rounded-lg border border-gray-200 p-4">
                                <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Response</p>
                                <pre className={`text-xs rounded-lg p-3 overflow-x-auto font-mono leading-relaxed ${log.success ? 'text-green-700 bg-green-50' : 'text-red-700 bg-red-50'}`}>
                                  {log.responsePayload
                                    ? JSON.stringify(JSON.parse(log.responsePayload), null, 2)
                                    : 'N/A'
                                  }
                                </pre>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  )
                })}
                {filteredLogs.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-gray-400">
                      <Activity className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                      該当するログが見つかりません
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  )
}
