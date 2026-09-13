import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { LoaderCircle } from 'lucide-react'
import { useAuth } from '../auth/AuthProvider'

export function AuthCallback() {
  const { session, loading } = useAuth(); const navigate = useNavigate()
  useEffect(() => { if (!loading) navigate(session ? '/today' : '/sign-in', { replace: true }) }, [loading, navigate, session])
  return <main className="center-screen"><LoaderCircle className="spin" /><p>Đang xác minh tài khoản…</p></main>
}
