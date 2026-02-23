import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

// モックモード：Supabaseが未設定の場合はモックユーザーを返す
const MOCK_USER: User = {
  id: 'mock-user-001',
  aud: 'authenticated',
  role: 'authenticated',
  email: 'admin@example.co.jp',
  email_confirmed_at: '2026-01-01T00:00:00Z',
  app_metadata: {},
  user_metadata: { full_name: '管理者' },
  identities: [],
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
}

const isMockMode = !import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY

export function useAuth(requireAuth = true) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    if (isMockMode) {
      // モックモード：常にログイン済みとして扱う
      setUser(MOCK_USER)
      setLoading(false)
      return
    }

    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      setLoading(false)

      if (requireAuth && !session?.user) {
        navigate('/login')
      }
    }

    getSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (requireAuth && !session?.user) {
        navigate('/login')
      }
    })

    return () => subscription.unsubscribe()
  }, [navigate, requireAuth])

  const signOut = async () => {
    if (isMockMode) {
      navigate('/login')
      return
    }
    await supabase.auth.signOut()
    navigate('/login')
  }

  return { user, loading, signOut, isMockMode }
}
