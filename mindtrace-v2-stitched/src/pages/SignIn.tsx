import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AuthShell } from '../components/AuthShell'
import { Field, PasswordField } from '../components/FormFields'
import { Status, SubmitButton } from '../components/Status'
import { authErrorMessage, classifyAuthError } from '../lib/auth-errors'
import { isSupabaseConfigured, supabase } from '../lib/supabase'

export function SignIn() {
  const [email, setEmail] = useState(''); const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [unverified, setUnverified] = useState(false)
  const navigate = useNavigate(); const location = useLocation()

  async function submit(event: FormEvent) {
    event.preventDefault(); setError(''); setUnverified(false)
    if (!isSupabaseConfigured) return setError('Cần cấu hình Supabase trước khi đăng nhập.')
    setBusy(true)
    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    setBusy(false)
    if (signInError) { const kind = classifyAuthError(signInError.message, signInError.code); setUnverified(kind === 'email_unverified'); return setError(authErrorMessage(kind)) }
    if (!data.user.email_confirmed_at) { await supabase.auth.signOut(); setUnverified(true); return setError(authErrorMessage('email_unverified')) }
    const from = (location.state as { from?: string } | null)?.from || '/today'; navigate(from, { replace: true })
  }

  return <AuthShell eyebrow="Chào mừng trở lại" title="Đăng nhập" description="Tiếp tục từ nơi bạn đã dừng lại.">
    <form onSubmit={submit} className="form-stack">
      <Field label="Email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      <PasswordField autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
      <Link className="forgot-link" to="/forgot-password">Quên mật khẩu?</Link>
      {error && <Status>{error}{unverified && <> <Link to={`/verify-email?email=${encodeURIComponent(email)}`}>Gửi lại email xác minh</Link></>}</Status>}
      <SubmitButton busy={busy}>Đăng nhập</SubmitButton>
    </form>
    <p className="auth-switch">Chưa có tài khoản? <Link to="/sign-up">Tạo tài khoản</Link></p>
  </AuthShell>
}
