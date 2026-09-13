import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthShell } from '../components/AuthShell'
import { PasswordField } from '../components/FormFields'
import { Status, SubmitButton } from '../components/Status'
import { useAuth } from '../auth/AuthProvider'
import { isSupabaseConfigured, supabase } from '../lib/supabase'

export function ResetPassword() {
  const { session, recoveryMode, loading } = useAuth(); const navigate = useNavigate()
  const [password, setPassword] = useState(''); const [confirm, setConfirm] = useState(''); const [busy, setBusy] = useState(false); const [error, setError] = useState('')
  async function submit(event: FormEvent) {
    event.preventDefault(); setError('')
    if (password.length < 8) return setError('Mật khẩu cần có ít nhất 8 ký tự.')
    if (password !== confirm) return setError('Hai mật khẩu chưa khớp nhau.')
    if (!isSupabaseConfigured || !session) return setError('Liên kết đã hết hạn hoặc không còn hợp lệ. Hãy yêu cầu một liên kết mới.')
    setBusy(true); const { error: updateError } = await supabase.auth.updateUser({ password }); setBusy(false)
    if (updateError) return setError('Chưa thể cập nhật mật khẩu. Liên kết có thể đã hết hạn.')
    navigate('/today', { replace: true })
  }
  const invalid = !loading && !session && !recoveryMode
  return <AuthShell eyebrow="Bảo mật tài khoản" title="Đặt mật khẩu mới" description="Chọn một mật khẩu bạn chưa dùng cho tài khoản này.">
    {invalid ? <><Status>Liên kết đã hết hạn hoặc không còn hợp lệ.</Status><Link className="primary-button" to="/forgot-password">Yêu cầu liên kết mới</Link></> : <form onSubmit={submit} className="form-stack">
      <PasswordField label="Mật khẩu mới" autoComplete="new-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
      <PasswordField label="Nhập lại mật khẩu" autoComplete="new-password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} />
      {error && <Status>{error}</Status>}<SubmitButton busy={busy}>Cập nhật mật khẩu</SubmitButton>
    </form>}
  </AuthShell>
}
