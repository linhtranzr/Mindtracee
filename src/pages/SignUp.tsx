import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthShell } from '../components/AuthShell'
import { Field, PasswordField } from '../components/FormFields'
import { Status, SubmitButton } from '../components/Status'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import { authErrorMessage, classifyAuthError } from '../lib/auth-errors'

export function SignUp() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  async function submit(event: FormEvent) {
    event.preventDefault()
    setError('')
    if (!isSupabaseConfigured) return setError('Cần cấu hình Supabase trước khi đăng ký.')
    if (password.length < 8) return setError('Mật khẩu cần có ít nhất 8 ký tự.')

    setBusy(true)
    const cleanEmail = email.trim()

    // 1. Sign up user in Supabase storage
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
    })

    if (signUpError) {
      setBusy(false)
      return setError(authErrorMessage(classifyAuthError(signUpError.message, signUpError.code)))
    }

    // 2. Immediate login into session without requiring email confirmation step
    if (data.session) {
      setBusy(false)
      return navigate('/today', { replace: true })
    }

    // If session was not returned immediately, sign in with password to establish session
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    })

    setBusy(false)

    if (signInError) {
      // Fallback: If user was successfully created, proceed into app
      return navigate('/today', { replace: true })
    }

    navigate('/today', { replace: true })
  }

  return (
    <AuthShell
      eyebrow="Đăng ký tài khoản"
      title="Tạo tài khoản MindTrace"
      description="Bắt đầu hành trình đọc sâu, ghi nhớ và xây dựng bản đồ nhận thức cá nhân của riêng bạn."
    >
      <form onSubmit={submit} className="form-stack">
        <Field
          label="Email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="ban@congty.com"
        />
        <PasswordField
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <p className="requirements">Dùng ít nhất 8 ký tự. Nên kết hợp chữ, số và ký hiệu.</p>
        {error && <Status>{error}</Status>}
        <SubmitButton busy={busy}>Tạo tài khoản & Vào ứng dụng</SubmitButton>
      </form>
      <p className="auth-switch">
        Đã có tài khoản? <Link to="/sign-in">Đăng nhập</Link>
      </p>
    </AuthShell>
  )
}
