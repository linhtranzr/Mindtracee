import { AlertCircle, CheckCircle2, LoaderCircle } from 'lucide-react'

export function Status({ tone = 'error', children }: { tone?: 'error' | 'success' | 'info'; children: React.ReactNode }) {
  return <div className={`status ${tone}`} role={tone === 'error' ? 'alert' : 'status'}>{tone === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}<span>{children}</span></div>
}

export function SubmitButton({ busy, children }: { busy: boolean; children: React.ReactNode }) {
  return <button className="primary-button" type="submit" disabled={busy}>{busy && <LoaderCircle className="spin" size={18} />}{children}</button>
}
