import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Calculator,
  Users,
  Handshake,
  FileText,
  Building2,
  ClipboardList,
  LogOut,
  Menu,
  X,
  Bot,
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

const navItems = [
  { path: '/', label: 'ダッシュボード', icon: LayoutDashboard },
  { path: '/accounting', label: '経理・会計', icon: Calculator },
  { path: '/hr', label: '人事・労務', icon: Users },
  { path: '/crm', label: '営業・CRM', icon: Handshake },
  { path: '/documents', label: 'ドキュメント', icon: FileText },
  { path: '/general', label: '総務', icon: Building2 },
  { path: '/audit', label: 'AI操作ログ', icon: ClipboardList },
]

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const { user, signOut } = useAuth()

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* モバイルオーバーレイ */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* サイドバー */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-200 ease-in-out
          lg:relative lg:translate-x-0 lg:z-auto
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
        style={{ backgroundColor: '#1a1a2e' }}
      >
        <div className="flex flex-col h-full">
          {/* ロゴ */}
          <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
            <Bot className="w-8 h-8 text-blue-400 shrink-0" />
            <div>
              <h1 className="text-white font-bold text-lg leading-tight">AI BackOffice</h1>
              <p className="text-gray-400 text-xs">管理ダッシュボード</p>
            </div>
            <button
              className="lg:hidden ml-auto text-gray-400 hover:text-white"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* ナビゲーション */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                    ${isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-white/10 hover:text-white'
                    }
                  `}
                >
                  <item.icon className="w-5 h-5 shrink-0" />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          {/* ユーザー情報 */}
          <div className="px-4 py-4 border-t border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                {(user?.user_metadata?.full_name ?? user?.email ?? '?')[0]}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-white text-sm font-medium truncate">
                  {user?.user_metadata?.full_name ?? '管理者'}
                </p>
                <p className="text-gray-400 text-xs truncate">{user?.email ?? ''}</p>
              </div>
              <button
                onClick={signOut}
                className="text-gray-400 hover:text-white transition-colors shrink-0"
                title="ログアウト"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* メインコンテンツ */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* モバイルヘッダー */}
        <header className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-gray-600 hover:text-gray-900"
          >
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="font-bold text-gray-900">AI BackOffice</h1>
        </header>

        {/* ページコンテンツ */}
        <main className="flex-1 p-4 lg:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
