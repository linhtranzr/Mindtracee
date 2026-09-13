import { BookOpen } from 'lucide-react'
import type { ReactNode } from 'react'

export function AuthShell({ eyebrow, title, description, children }: { eyebrow: string; title: string; description?: string; children: ReactNode }) {
  return (
    <main className="auth-layout">
      <section className="brand-story" aria-label="Giới thiệu MindTrace">
        <a className="brand" href="/" aria-label="MindTrace — trang chủ"><BookOpen size={22} /> MindTrace</a>
        <div>
          <p className="eyebrow">Quiet reading, visible understanding</p>
          <h1>Đừng chỉ đọc.<br />Hãy để kiến thức ở lại.</h1>
          <p>Đọc sâu, tự nhớ lại và nhìn thấy sự hiểu biết hình thành theo thời gian.</p>
        </div>
        <blockquote>“Hiểu không phải là nhớ từng câu — mà là có thể diễn đạt lại bằng lời của mình.”</blockquote>
      </section>
      <section className="auth-panel">
        <div className="auth-card">
          <p className="eyebrow">{eyebrow}</p>
          <h2>{title}</h2>
          {description && <p className="lede">{description}</p>}
          {children}
        </div>
      </section>
    </main>
  )
}
