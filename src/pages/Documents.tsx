import { useState } from 'react'
import { Search, FileText, Download } from 'lucide-react'
import { Layout } from '../components/Layout'
import { StatusBadge } from '../components/StatusBadge'
import { mockDocuments } from '../lib/mockData'

const fileTypeIcons: Record<string, string> = {
  pdf: 'text-red-500',
  xlsx: 'text-green-600',
  docx: 'text-blue-600',
}

export function Documents() {
  const [search, setSearch] = useState('')

  const filteredDocs = mockDocuments.filter(
    (doc) =>
      doc.title.toLowerCase().includes(search.toLowerCase()) ||
      doc.tags.some((t) => t.includes(search))
  )

  const templates = mockDocuments.filter((d) => d.category === 'template')
  const nonTemplates = filteredDocs.filter((d) => d.category !== 'template')

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ドキュメント</h1>
          <p className="text-gray-500 mt-1">社内文書・テンプレートの検索・閲覧</p>
        </div>

        {/* 検索バー */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ドキュメントを検索..."
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* ドキュメント一覧 */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">ドキュメント一覧</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-200">
                  <th className="pb-3 font-medium">タイトル</th>
                  <th className="pb-3 font-medium text-center">カテゴリ</th>
                  <th className="pb-3 font-medium">アップロード者</th>
                  <th className="pb-3 font-medium">日付</th>
                  <th className="pb-3 font-medium">タグ</th>
                  <th className="pb-3 font-medium text-center">操作</th>
                </tr>
              </thead>
              <tbody>
                {nonTemplates.map((doc, i) => (
                  <tr key={doc.id} className={`border-b border-gray-100 ${i % 2 === 0 ? 'bg-gray-50/50' : ''}`}>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <FileText className={`w-4 h-4 shrink-0 ${fileTypeIcons[doc.file_type] ?? 'text-gray-400'}`} />
                        <span className="text-gray-900 font-medium">{doc.title}</span>
                        <span className="text-xs text-gray-400 uppercase">.{doc.file_type}</span>
                      </div>
                    </td>
                    <td className="py-3 text-center"><StatusBadge status={doc.category} /></td>
                    <td className="py-3 text-gray-600">{doc.uploaded_by}</td>
                    <td className="py-3 text-gray-600">{doc.uploaded_at}</td>
                    <td className="py-3">
                      <div className="flex flex-wrap gap-1">
                        {doc.tags.map((tag) => (
                          <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 text-center">
                      <button className="text-blue-600 hover:text-blue-800" title="ダウンロード">
                        <Download className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {nonTemplates.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-400">
                      該当するドキュメントが見つかりません
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* テンプレート */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">テンプレート</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((tpl) => (
              <div key={tpl.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-sm transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                    <FileText className={`w-5 h-5 ${fileTypeIcons[tpl.file_type] ?? 'text-gray-400'}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">{tpl.title}</p>
                    <p className="text-xs text-gray-500">.{tpl.file_type} - {tpl.uploaded_at}</p>
                  </div>
                  <button className="text-blue-600 hover:text-blue-800 shrink-0" title="ダウンロード">
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  )
}
