import { useState } from 'react'
import {
  Search,
  FileText,
  Download,
  ChevronDown,
  ChevronRight,
  File,
  FileCheck,
  BookOpen,
  BarChart3,
  Brain,
  Copy,
  Hash,
} from 'lucide-react'
import { Layout } from '../components/Layout'
import {
  mockDocumentsExtended,
  mockDocTemplates,
} from '../lib/mockData'

const categoryConfig: Record<string, { label: string; color: string; bg: string; border: string }> = {
  contract: { label: '契約書', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
  invoice: { label: '見積書', color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200' },
  report: { label: 'レポート', color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200' },
  manual: { label: 'マニュアル', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
  template: { label: 'テンプレート', color: 'text-cyan-700', bg: 'bg-cyan-50', border: 'border-cyan-200' },
  other: { label: 'その他', color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200' },
}

const templateCategoryConfig: Record<string, { label: string; color: string; bg: string }> = {
  contract: { label: '契約書', color: 'text-blue-700', bg: 'bg-blue-50' },
  invoice: { label: '見積書', color: 'text-green-700', bg: 'bg-green-50' },
  report: { label: 'レポート', color: 'text-purple-700', bg: 'bg-purple-50' },
  manual: { label: 'マニュアル', color: 'text-amber-700', bg: 'bg-amber-50' },
}

export function Documents() {
  const [search, setSearch] = useState('')
  const [expandedRow, setExpandedRow] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const categories = ['all', 'contract', 'invoice', 'report', 'manual'] as const
  const categoryLabels: Record<string, string> = {
    all: 'すべて',
    contract: '契約書',
    invoice: '見積書/請求書',
    report: 'レポート',
    manual: 'マニュアル/規程',
  }

  const filteredDocs = mockDocumentsExtended.filter((doc) => {
    const matchesSearch = search === '' || doc.title.toLowerCase().includes(search.toLowerCase()) || doc.createdBy.includes(search)
    const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  // Stats
  const totalDocs = mockDocumentsExtended.length
  const totalTemplates = mockDocTemplates.length
  const thisMonthDocs = mockDocumentsExtended.filter(d => d.createdAt.startsWith('2026-02')).length
  const ragSearchCount = 156

  return (
    <Layout>
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ドキュメント</h1>
          <p className="text-gray-500 mt-1">社内文書・テンプレートの検索・閲覧・管理</p>
        </div>

        {/* ── Search Bar ── */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ドキュメントを検索（タイトル、作成者で検索）..."
            className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm text-base"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs text-gray-400">
            <Brain className="w-4 h-4" />
            <span>RAG検索対応</span>
          </div>
        </div>

        {/* ── Stats Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{totalDocs}</p>
                <p className="text-xs text-gray-500">総ドキュメント数</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                <Copy className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{totalTemplates}</p>
                <p className="text-xs text-gray-500">テンプレート数</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                <File className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{thisMonthDocs}</p>
                <p className="text-xs text-gray-500">今月の作成数</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{ragSearchCount}</p>
                <p className="text-xs text-gray-500">RAG検索回数</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Document List ── */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">ドキュメント一覧</h2>
            {/* Category filter tabs */}
            <div className="flex gap-1.5">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    selectedCategory === cat
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {categoryLabels[cat]}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="pb-3 text-left font-semibold text-gray-500 text-xs uppercase tracking-wider w-8"></th>
                  <th className="pb-3 text-left font-semibold text-gray-500 text-xs uppercase tracking-wider">タイトル</th>
                  <th className="pb-3 text-center font-semibold text-gray-500 text-xs uppercase tracking-wider">カテゴリ</th>
                  <th className="pb-3 text-center font-semibold text-gray-500 text-xs uppercase tracking-wider">バージョン</th>
                  <th className="pb-3 text-left font-semibold text-gray-500 text-xs uppercase tracking-wider">作成者</th>
                  <th className="pb-3 text-left font-semibold text-gray-500 text-xs uppercase tracking-wider">作成日</th>
                  <th className="pb-3 text-center font-semibold text-gray-500 text-xs uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredDocs.map((doc, i) => {
                  const catConfig = categoryConfig[doc.category] || categoryConfig.other
                  const isExpanded = expandedRow === doc.id
                  return (
                    <>
                      <tr
                        key={doc.id}
                        className={`border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer ${i % 2 === 0 ? 'bg-gray-50/30' : ''}`}
                        onClick={() => setExpandedRow(isExpanded ? null : doc.id)}
                      >
                        <td className="py-3.5 pl-2">
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                          )}
                        </td>
                        <td className="py-3.5">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-gray-400 shrink-0" />
                            <span className="text-gray-900 font-semibold">{doc.title}</span>
                            <span className="text-[10px] text-gray-400 uppercase bg-gray-100 px-1.5 py-0.5 rounded">.{doc.fileType}</span>
                          </div>
                        </td>
                        <td className="py-3.5 text-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${catConfig.bg} ${catConfig.color}`}>
                            {catConfig.label}
                          </span>
                        </td>
                        <td className="py-3.5 text-center">
                          <span className="text-xs font-mono text-gray-500 bg-gray-50 px-2 py-1 rounded">{doc.version}</span>
                        </td>
                        <td className="py-3.5">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shrink-0">
                              <span className="text-[9px] text-white font-bold">{doc.createdBy[0]}</span>
                            </div>
                            <span className="text-gray-600">{doc.createdBy}</span>
                          </div>
                        </td>
                        <td className="py-3.5 text-gray-600">{doc.createdAt}</td>
                        <td className="py-3.5 text-center">
                          <button
                            className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                            title="ダウンロード"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                      {/* Expanded preview row */}
                      {isExpanded && (
                        <tr key={`${doc.id}-preview`} className="bg-gray-50/50">
                          <td colSpan={7} className="py-4 px-8">
                            <div className="bg-white rounded-lg border border-gray-200 p-4">
                              <p className="text-xs font-medium text-gray-500 mb-2">プレビュー</p>
                              <p className="text-sm text-gray-700 leading-relaxed">{doc.contentPreview}</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  )
                })}
                {filteredDocs.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-gray-400">
                      <FileText className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                      該当するドキュメントが見つかりません
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Template Gallery ── */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">テンプレートギャラリー</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {mockDocTemplates.map((tpl) => {
              const tplCat = templateCategoryConfig[tpl.category] || templateCategoryConfig.contract
              return (
                <div
                  key={tpl.id}
                  className="border border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-md transition-all group"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0 group-hover:bg-blue-100 transition-colors">
                      {tpl.category === 'contract' && <FileCheck className="w-5 h-5 text-blue-600" />}
                      {tpl.category === 'invoice' && <File className="w-5 h-5 text-green-600" />}
                      {tpl.category === 'report' && <BarChart3 className="w-5 h-5 text-purple-600" />}
                      {tpl.category === 'manual' && <BookOpen className="w-5 h-5 text-amber-600" />}
                    </div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${tplCat.bg} ${tplCat.color}`}>
                      {tplCat.label}
                    </span>
                  </div>

                  {/* Name & description */}
                  <h3 className="text-sm font-bold text-gray-900 mb-1">{tpl.name}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed mb-3 line-clamp-2">{tpl.description}</p>

                  {/* Usage count */}
                  <div className="flex items-center gap-1 text-[10px] text-gray-400 mb-3">
                    <Hash className="w-3 h-3" />
                    <span>使用回数: {tpl.usageCount}回</span>
                  </div>

                  {/* Variables */}
                  <div className="flex flex-wrap gap-1">
                    {tpl.variables.slice(0, 3).map((v) => (
                      <span key={v} className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-[10px]">
                        {'{'}
                        {v}
                        {'}'}
                      </span>
                    ))}
                    {tpl.variables.length > 3 && (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-400 rounded text-[10px]">
                        +{tpl.variables.length - 3}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </Layout>
  )
}
