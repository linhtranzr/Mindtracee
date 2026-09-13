import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { AuthShell } from '../components/AuthShell'
import { Field } from '../components/FormFields'
import { Status, SubmitButton } from '../components/Status'
import { appUrl, isSupabaseConfigured, supabase } from '../lib/supabase'

export function ForgotPassword() {
  const [email, setEmail] = useState(''); const [busy, setBusy] = useState(false); const [sent, setSent] = useState(false); const [error, setError] = useState('')
  async function submit(event: FormEvent) {
    event.preventDefault(); setError('')
    if (!isSupabaseConfigured) return setError('Cần cấu hình Supabase trước khi gửi yêu cầu.')
    setBusy(true); const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: appUrl('/reset-password') }); setBusy(false)
    if (resetError) return setError('Chưa thể gửi yêu cầu lúc này. Hãy đợi một chút rồi thử lại.')
    setSent(true)
  }
  return <AuthShell eyebrow="Khôi phục tài khoản" title="Quên mật khẩu?" description="Nhập email của bạn. MindTrace sẽ gửi link để đặt lại mật khẩu mới.">
    <form onSubmit={submit} className="form-stack">
      <Field label="Email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      {sent && <Status tone="success">Nếu email này thuộc một tài khoản, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu.</Status>}
      {error && <Status>{error}</Status>}
      <SubmitButton busy={busy}>Gửi link đặt lại mật khẩu</SubmitButton>
    </form>
    <p className="auth-switch"><Link to="/sign-in">Trở về đăng nhập</Link></p>
  </AuthShell>
}
