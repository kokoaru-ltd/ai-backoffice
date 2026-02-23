import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isMockMode = !supabaseUrl || !supabaseAnonKey

export const supabase: SupabaseClient = isMockMode
  ? createClient('https://placeholder.supabase.co', 'placeholder-key', { auth: { autoRefreshToken: false, persistSession: false } })
  : createClient(supabaseUrl, supabaseAnonKey)
