import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { AuthChangeEvent, Session, User } from '@supabase/supabase-js'
import { isSupabaseConfigured, supabase } from '../lib/supabase'

type AuthContextValue = {
  session: Session | null
  user: User | null
  loading: boolean
  recoveryMode: boolean
  configured: boolean
  setDemoUserSession: (demoUser: User | null) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [demoUser, setDemoUser] = useState<User | null>(() => {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem('mindtrace_demo_user')
      if (stored) {
        try {
          return JSON.parse(stored) as User
        } catch {
          return null
        }
      }
    }
    return null
  })
  const [loading, setLoading] = useState(true)
  const [recoveryMode, setRecoveryMode] = useState(false)

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false)
      return
    }

    let active = true
    void supabase.auth.getSession().then(({ data }) => {
      if (active) {
        setSession(data.session)
        setLoading(false)
      }
    })

    const { data } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, nextSession) => {
      if (!active) return
      setSession(nextSession)
      setLoading(false)
      if (event === 'PASSWORD_RECOVERY') setRecoveryMode(true)
    })

    return () => {
      active = false
      data.subscription.unsubscribe()
    }
  }, [])

  const setDemoUserSession = (user: User | null) => {
    setDemoUser(user)
    if (typeof localStorage !== 'undefined') {
      if (user) {
        localStorage.setItem('mindtrace_demo_user', JSON.stringify(user))
      } else {
        localStorage.removeItem('mindtrace_demo_user')
      }
    }
  }

  const currentUser = session?.user ?? demoUser

  const value = useMemo(
    () => ({
      session,
      user: currentUser,
      loading,
      recoveryMode,
      configured: isSupabaseConfigured,
      setDemoUserSession,
    }),
    [session, currentUser, loading, recoveryMode],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}

