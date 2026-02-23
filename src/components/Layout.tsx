import { useState, useRef, useEffect } from 'react'
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
  Bell,
  ChevronRight,
  ChevronDown,
  Crown,
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

const breadcrumbMap: Record<string, string> = {
  '/': 'ダッシュボード',
  '/accounting': '経理・会計',
  '/hr': '人事・労務',
  '/crm': '営業・CRM',
  '/documents': 'ドキュメント',
  '/general': '総務',
  '/audit': 'AI操作ログ',
}

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const location = useLocation()
  const { user, signOut } = useAuth()
  const userMenuRef = useRef<HTMLDivElement>(null)

  const notificationCount = 3

  // ユーザーメニュー外クリックで閉じる
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const currentPageName = breadcrumbMap[location.pathname] || ''

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* モバイルオーバーレイ */}
      <div
        className={`fixed inset-0 bg-black/60 z-40 lg:hidden transition-opacity duration-300 ${
          sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* サイドバー */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out
          lg:relative lg:translate-x-0 lg:z-auto
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
        style={{
          background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)',
        }}
      >
        <div className="flex flex-col h-full">
          {/* ロゴ */}
          <div className="flex items-center gap-3 px-5 py-5 border-b border-white/8">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-white font-bold text-base leading-tight tracking-tight">AI BackOffice</h1>
              <p className="text-slate-400 text-xs mt-0.5">管理ダッシュボード</p>
            </div>
            <button
              className="lg:hidden text-slate-400 hover:text-white transition-colors"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* ナビゲーション */}
          <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                    transition-all duration-200 group
                    ${isActive
                      ? 'bg-white/10 text-white'
                      : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                    }
                  `}
                >
                  {/* 左側のアクセントバー */}
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-blue-500 rounded-r-full" />
                  )}
                  <item.icon className={`w-5 h-5 shrink-0 transition-colors duration-200 ${
                    isActive ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'
                  }`} />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>

          {/* サイドバーフッター: 組織情報 */}
          <div className="px-4 py-4 border-t border-white/8">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center shrink-0">
                <Building2 className="w-4 h-4 text-slate-300" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-white text-sm font-medium truncate leading-tight">株式会社デモテック</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Crown className="w-3 h-3 text-amber-400" />
                  <span className="text-xs font-semibold text-amber-400">Pro</span>
                </div>
              </div>
            </div>

            {/* ユーザー情報 */}
            <div className="flex items-center gap-3 pt-3 border-t border-white/8">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-xs font-bold shrink-0">
                {(user?.user_metadata?.full_name ?? user?.email ?? '?')[0]}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-white text-sm font-medium truncate">
                  {user?.user_metadata?.full_name ?? '管理者'}
                </p>
                <p className="text-slate-500 text-xs truncate">{user?.email ?? ''}</p>
              </div>
              <button
                onClick={signOut}
                className="text-slate-500 hover:text-red-400 transition-colors shrink-0"
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
        {/* トップヘッダーバー */}
        <header className="bg-white border-b border-gray-200 px-4 lg:px-8 h-14 flex items-center justify-between sticky top-0 z-30 shrink-0">
          <div className="flex items-center gap-3">
            {/* モバイルメニューボタン */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-gray-500 hover:text-gray-900 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* ブレッドクラム */}
            <nav className="flex items-center gap-1.5 text-sm">
              <span className="text-gray-400 hidden sm:inline">ホーム</span>
              {currentPageName && (
                <>
                  <ChevronRight className="w-3.5 h-3.5 text-gray-300 hidden sm:block" />
                  <span className="font-semibold text-gray-900">{currentPageName}</span>
                </>
              )}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            {/* 通知ベルアイコン */}
            <button className="relative p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
              <Bell className="w-5 h-5" />
              {notificationCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {notificationCount}
                </span>
              )}
            </button>

            {/* ユーザーアバタードロップダウン */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-xs font-bold">
                  {(user?.user_metadata?.full_name ?? user?.email ?? '?')[0]}
                </div>
                <span className="text-sm font-medium text-gray-700 hidden md:inline">
                  {user?.user_metadata?.full_name ?? '管理者'}
                </span>
                <ChevronDown className="w-4 h-4 text-gray-400 hidden md:block" />
              </button>

              {/* ドロップダウンメニュー */}
              {userMenuOpen && (
                <div className="absolute right-0 mt-1 w-56 bg-white rounded-xl border border-gray-200 shadow-lg py-1 z-50">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-900">
                      {user?.user_metadata?.full_name ?? '管理者'}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">{user?.email ?? ''}</p>
                  </div>
                  <button
                    onClick={() => {
                      setUserMenuOpen(false)
                      signOut()
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    ログアウト
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ページコンテンツ */}
        <main className="flex-1 p-4 lg:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
