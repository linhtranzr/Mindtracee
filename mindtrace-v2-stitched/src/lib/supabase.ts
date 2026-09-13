import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim()
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim()

export const isSupabaseConfigured = Boolean(supabaseUrl && publishableKey)

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  publishableKey || 'sb_publishable_placeholder',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'implicit',
    },
  },
)

export function appUrl(path: string) {
  return new URL(path, window.location.origin).toString()
}
