import {
  Package,
  CheckCircle2,
  Wrench,
  AlertCircle,
  Laptop,
  Monitor,
  Smartphone,
  Printer,
  Keyboard,
  Mouse,
  Headphones,
  Camera,
  Tablet,
} from 'lucide-react'
import { Layout } from '../components/Layout'
import { mockEquipmentExtended, mockOfficeRequests } from '../lib/mockData'

const statusConfig: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  in_use: { label: '使用中', color: 'text-green-700', bg: 'bg-green-50', dot: 'bg-green-500' },
  available: { label: '利用可能', color: 'text-blue-700', bg: 'bg-blue-50', dot: 'bg-blue-500' },
  maintenance: { label: 'メンテナンス', color: 'text-amber-700', bg: 'bg-amber-50', dot: 'bg-amber-500' },
  disposed: { label: '廃棄', color: 'text-gray-500', bg: 'bg-gray-50', dot: 'bg-gray-400' },
}

const categoryIcons: Record<string, typeof Laptop> = {
  laptop: Laptop,
  desktop: Laptop,
  monitor: Monitor,
  smartphone: Smartphone,
  printer: Printer,
  keyboard: Keyboard,
  mouse: Mouse,
  headphones: Headphones,
  camera: Camera,
  tablet: Tablet,
  projector: Monitor,
}

const requestTypeConfig: Record<string, { label: string; color: string; bg: string }> = {
  supply: { label: '消耗品', color: 'text-green-700', bg: 'bg-green-50' },
  maintenance: { label: 'メンテナンス', color: 'text-amber-700', bg: 'bg-amber-50' },
  it_support: { label: 'ITサポート', color: 'text-blue-700', bg: 'bg-blue-50' },
  other: { label: 'その他', color: 'text-gray-600', bg: 'bg-gray-50' },
}

const requestStages = [
  { key: 'pending', label: '未対応', color: '#f59e0b', bg: 'bg-amber-50', border: 'border-amber-200' },
  { key: 'approved', label: '承認済', color: '#3b82f6', bg: 'bg-blue-50', border: 'border-blue-200' },
  { key: 'in_progress', label: '対応中', color: '#8b5cf6', bg: 'bg-purple-50', border: 'border-purple-200' },
  { key: 'completed', label: '完了', color: '#22c55e', bg: 'bg-green-50', border: 'border-green-200' },
]

export function General() {
  // Stats
  const totalEquipment = mockEquipmentExtended.length
  const activeCount = mockEquipmentExtended.filter(e => e.status === 'in_use').length
  const maintenanceCount = mockEquipmentExtended.filter(e => e.status === 'maintenance').length
  const pendingRequests = mockOfficeRequests.filter(r => r.status === 'pending').length

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">総務</h1>
          <p className="text-gray-500 mt-1">備品管理・オフィスリクエスト</p>
        </div>

        {/* ── Stats Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{totalEquipment}</p>
                <p className="text-xs text-gray-500">備品総数</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{activeCount}</p>
                <p className="text-xs text-gray-500">稼働中</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
                <Wrench className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{maintenanceCount}</p>
                <p className="text-xs text-gray-500">メンテナンス中</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{pendingRequests}</p>
                <p className="text-xs text-gray-500">未対応リクエスト</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Equipment Table ── */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">備品管理</h2>
            <span className="text-xs text-gray-400">{totalEquipment}件</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="pb-3 text-left font-semibold text-gray-500 text-xs uppercase tracking-wider">備品名</th>
                  <th className="pb-3 text-left font-semibold text-gray-500 text-xs uppercase tracking-wider">カテゴリ</th>
                  <th className="pb-3 text-left font-semibold text-gray-500 text-xs uppercase tracking-wider">設置場所</th>
                  <th className="pb-3 text-left font-semibold text-gray-500 text-xs uppercase tracking-wider">利用者</th>
                  <th className="pb-3 text-center font-semibold text-gray-500 text-xs uppercase tracking-wider">ステータス</th>
                  <th className="pb-3 text-left font-semibold text-gray-500 text-xs uppercase tracking-wider">登録日</th>
                </tr>
              </thead>
              <tbody>
                {mockEquipmentExtended.map((eq, i) => {
                  const st = statusConfig[eq.status] || statusConfig.available
                  const IconComponent = categoryIcons[eq.categoryIcon] || Package
                  return (
                    <tr
                      key={eq.id}
                      className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${i % 2 === 0 ? 'bg-gray-50/30' : ''}`}
                    >
                      <td className="py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                            <IconComponent className="w-4 h-4 text-gray-500" />
                          </div>
                          <span className="text-gray-900 font-semibold">{eq.name}</span>
                        </div>
                      </td>
                      <td className="py-3.5 text-gray-600">{eq.category}</td>
                      <td className="py-3.5">
                        <span className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">{eq.location}</span>
                      </td>
                      <td className="py-3.5">
                        {eq.assignedTo !== '-' ? (
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shrink-0">
                              <span className="text-[9px] text-white font-bold">{eq.assignedTo[0]}</span>
                            </div>
                            <span className="text-gray-600">{eq.assignedTo}</span>
                          </div>
                        ) : (
                          <span className="text-gray-300">-</span>
                        )}
                      </td>
                      <td className="py-3.5 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${st.bg} ${st.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                          {st.label}
                        </span>
                      </td>
                      <td className="py-3.5 text-gray-500 text-xs">{eq.registeredAt}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Office Requests Kanban ── */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">オフィスリクエスト</h2>
            <span className="text-xs text-gray-400">{mockOfficeRequests.length}件</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {requestStages.map((stage) => {
              // Map 'approved' to check if any exist (none in current data, but structure is ready)
              const stageKey = stage.key
              const requests = mockOfficeRequests.filter(r => {
                if (stageKey === 'approved') return false // no approved status in current data
                return r.status === stageKey
              })
              return (
                <div key={stage.key} className={`rounded-xl border ${stage.border} p-3 min-h-32`}>
                  {/* Stage header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: stage.color }} />
                      <span className="text-xs font-bold text-gray-700">{stage.label}</span>
                    </div>
                    <span className="text-[10px] text-gray-400 bg-white px-2 py-0.5 rounded-full">{requests.length}</span>
                  </div>

                  {/* Request cards */}
                  <div className="space-y-2">
                    {requests.map((req) => {
                      const typeConf = requestTypeConfig[req.type] || requestTypeConfig.other
                      return (
                        <div key={req.id} className="bg-white rounded-lg p-3 border border-gray-100 shadow-sm">
                          {/* Type badge */}
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${typeConf.bg} ${typeConf.color} mb-1.5`}>
                            {typeConf.label}
                          </span>
                          <p className="text-xs font-semibold text-gray-900 mb-1">{req.title}</p>
                          <p className="text-[10px] text-gray-500 line-clamp-2 mb-2">{req.description}</p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                                <span className="text-[7px] text-white font-bold">{req.requested_by[0]}</span>
                              </div>
                              <span className="text-[10px] text-gray-400">{req.requested_by.split(' ')[0]}</span>
                            </div>
                            <span className="text-[10px] text-gray-400">{req.created_at.slice(5)}</span>
                          </div>
                          {req.priority === 'high' && (
                            <div className="mt-1.5 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3 text-red-500" />
                              <span className="text-[10px] text-red-500 font-medium">高優先度</span>
                            </div>
                          )}
                        </div>
                      )
                    })}
                    {requests.length === 0 && (
                      <p className="text-xs text-gray-400 text-center py-6">リクエストなし</p>
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
