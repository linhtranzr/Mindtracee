import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { MailCheck } from 'lucide-react'
import { AuthShell } from '../components/AuthShell'
import { Status } from '../components/Status'
import { appUrl, isSupabaseConfigured, supabase } from '../lib/supabase'

export function VerifyEmail() {
  const [params] = useSearchParams(); const email = params.get('email') || ''
  const [busy, setBusy] = useState(false); const [status, setStatus] = useState('')
  async function resend() {
    if (!email || !isSupabaseConfigured) return setStatus('Nhập lại email từ màn hình đăng ký để tiếp tục.')
    setBusy(true); const { error } = await supabase.auth.resend({ type: 'signup', email, options: { emailRedirectTo: appUrl('/auth/callback') } }); setBusy(false)
    setStatus(error ? 'Chưa thể gửi lại lúc này. Hãy đợi một chút rồi thử lại.' : 'Nếu yêu cầu hợp lệ, một email xác minh mới sẽ được gửi đến bạn.')
  }
  return <AuthShell eyebrow="Còn một bước" title="Kiểm tra email của bạn" description={email ? `MindTrace đã gửi một link xác minh đến ${email}. Hãy bấm link đó để hoàn tất đăng ký.` : 'Mở email xác minh để hoàn tất đăng ký.'}>
    <div className="verify-icon"><MailCheck size={32} /></div>
    {status && <Status tone="info">{status}</Status>}
    <button className="primary-button" onClick={resend} disabled={busy}>{busy ? 'Đang gửi…' : 'Gửi lại email xác minh'}</button>
    <div className="stacked-links"><Link to="/sign-up">Đổi email</Link><Link to="/sign-in">Trở về đăng nhập</Link></div>
  </AuthShell>
}
