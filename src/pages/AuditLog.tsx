import { useState } from 'react'
import { CheckCircle2, XCircle } from 'lucide-react'
import { Layout } from '../components/Layout'
import { StatusBadge } from '../components/StatusBadge'
import { mockAuditLogs } from '../lib/mockData'

const domains = ['all', 'accounting', 'hr', 'crm', 'documents', 'general'] as const
const domainLabels: Record<string, string> = {
  all: 'すべて',
  accounting: '経理',
  hr: '人事',
  crm: '営業',
  documents: 'ドキュメント',
  general: '総務',
}

export function AuditLog() {
  const [selectedDomain, setSelectedDomain] = useState<string>('all')

  const filteredLogs = selectedDomain === 'all'
    ? mockAuditLogs
    : mockAuditLogs.filter((log) => log.domain === selectedDomain)

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI操作ログ</h1>
          <p className="text-gray-500 mt-1">AIが実行した操作の履歴を確認</p>
        </div>

        {/* フィルター */}
        <div className="flex flex-wrap gap-2">
          {domains.map((domain) => (
            <button
              key={domain}
              onClick={() => setSelectedDomain(domain)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedDomain === domain
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {domainLabels[domain]}
            </button>
          ))}
        </div>

        {/* ログテーブル */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-200">
                  <th className="pb-3 font-medium">日時</th>
                  <th className="pb-3 font-medium">ユーザー</th>
                  <th className="pb-3 font-medium text-center">ドメイン</th>
                  <th className="pb-3 font-medium">意図</th>
                  <th className="pb-3 font-medium">アクション</th>
                  <th className="pb-3 font-medium">詳細</th>
                  <th className="pb-3 font-medium text-center">結果</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log, i) => (
                  <tr key={log.id} className={`border-b border-gray-100 ${i % 2 === 0 ? 'bg-gray-50/50' : ''}`}>
                    <td className="py-3 text-gray-600 whitespace-nowrap text-xs">{log.timestamp}</td>
                    <td className="py-3 text-gray-900 font-medium whitespace-nowrap">{log.user_name}</td>
                    <td className="py-3 text-center">
                      <StatusBadge status={log.domain} label={domainLabels[log.domain]} />
                    </td>
                    <td className="py-3 text-gray-700">{log.intent}</td>
                    <td className="py-3 text-gray-500 font-mono text-xs">{log.action}</td>
                    <td className="py-3 text-gray-600 max-w-64 truncate">{log.detail}</td>
                    <td className="py-3 text-center">
                      {log.success ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500 inline-block" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500 inline-block" />
                      )}
                    </td>
                  </tr>
                ))}
                {filteredLogs.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-400">
                      該当するログが見つかりません
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* サマリー */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{mockAuditLogs.length}</p>
            <p className="text-sm text-gray-500">総操作数</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{mockAuditLogs.filter((l) => l.success).length}</p>
            <p className="text-sm text-gray-500">成功</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-2xl font-bold text-red-600">{mockAuditLogs.filter((l) => !l.success).length}</p>
            <p className="text-sm text-gray-500">失敗</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">
              {Math.round((mockAuditLogs.filter((l) => l.success).length / mockAuditLogs.length) * 100)}%
            </p>
            <p className="text-sm text-gray-500">成功率</p>
          </div>
        </div>
      </div>
    </Layout>
  )
}
