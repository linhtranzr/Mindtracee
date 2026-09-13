import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthShell } from '../components/AuthShell'
import { Field, PasswordField } from '../components/FormFields'
import { Status, SubmitButton } from '../components/Status'
import { appUrl, isSupabaseConfigured, supabase } from '../lib/supabase'
import { authErrorMessage, classifyAuthError } from '../lib/auth-errors'

export function SignUp() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  async function submit(event: FormEvent) {
    event.preventDefault(); setError('')
    if (!isSupabaseConfigured) return setError('Cần cấu hình Supabase trước khi đăng ký.')
    if (password.length < 8) return setError('Mật khẩu cần có ít nhất 8 ký tự.')
    setBusy(true)
    const { data, error: signUpError } = await supabase.auth.signUp({ email: email.trim(), password, options: { emailRedirectTo: appUrl('/auth/callback') } })
    setBusy(false)
    if (signUpError) return setError(authErrorMessage(classifyAuthError(signUpError.message, signUpError.code)))
    if (data.session && data.user?.email_confirmed_at) return navigate('/today', { replace: true })
    navigate(`/verify-email?email=${encodeURIComponent(email.trim())}`, { replace: true })
  }

  return <AuthShell eyebrow="Bắt đầu" title="Tạo tài khoản MindTrace" description="Một không gian riêng để đọc, suy ngẫm và trở lại với điều quan trọng.">
    <form onSubmit={submit} className="form-stack">
      <Field label="Email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ban@congty.com" />
      <PasswordField autoComplete="new-password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
      <p className="requirements">Dùng ít nhất 8 ký tự. Nên kết hợp chữ, số và ký hiệu.</p>
      {error && <Status>{error}</Status>}
      <SubmitButton busy={busy}>Tạo tài khoản</SubmitButton>
    </form>
    <p className="auth-switch">Đã có tài khoản? <Link to="/sign-in">Đăng nhập</Link></p>
  </AuthShell>
}
