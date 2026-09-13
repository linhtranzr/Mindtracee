import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import type { User } from '@supabase/supabase-js'
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Brain,
  CheckCircle2,
  Eye,
  EyeOff,
  Feather,
  GitFork,
  LoaderCircle,
  Lock,
  Mail,
  Sparkles,
  Zap
} from 'lucide-react'
import { useAuth } from '../auth/AuthProvider'
import { isSupabaseConfigured, supabase } from '../lib/supabase'

export function SignIn() {
  const navigate = useNavigate()
  const location = useLocation()
  const { setDemoUserSession } = useAuth()

  // Tab State: 'instant' vs 'classic'
  const [activeTab, setActiveTab] = useState<'instant' | 'classic'>('instant')

  // Classic Form States
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [unverified, setUnverified] = useState(false)
  const [selectedProfileLabel, setSelectedProfileLabel] = useState<string | null>(null)

  // Select profile and transition to Email & Password Login Step ('classic')
  function handleSelectProfile(profileEmail: string, categoryKey: string, categoryLabel: string) {
    setError('')
    setEmail(profileEmail)
    setPassword('demoPassword123!')
    setSelectedProfileLabel(categoryLabel)

    // Save classification preference for automatic reader customization
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('mindtrace_user_category', categoryKey)
      localStorage.setItem('mindtrace_user_category_label', categoryLabel)
    }

    // Switch view to Tab 2: Email & Mật khẩu (Bước đăng nhập tài khoản)
    setActiveTab('classic')
  }

  // Classic Password Login Handler
  async function handleSubmitClassic(event: FormEvent) {
    event.preventDefault()
    setError('')
    setUnverified(false)
    setBusy(true)
    const from = (location.state as { from?: string } | null)?.from || '/today'

    // Retrieve active category preference
    const storedCat = typeof localStorage !== 'undefined' ? localStorage.getItem('mindtrace_user_category') : null
    const knownCategory = storedCat || (
      email.includes('genz') ? 'genz' :
      email.includes('busy') ? 'busy_deepwork' :
      email.includes('academic') ? 'academic_research' : 'academic_research'
    )
    const knownLabel = selectedProfileLabel || (
      knownCategory === 'genz' ? 'Gen Z Tĩnh Lặng' :
      knownCategory === 'busy_deepwork' ? 'Khối Bận Rộn Deep Work' : 'Học Giả Nghiên Cứu'
    )

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('mindtrace_user_category', knownCategory)
      localStorage.setItem('mindtrace_user_category_label', knownLabel)
    }

    if (isSupabaseConfigured) {
      try {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        })

        if (!signInError && data.user) {
          setBusy(false)
          return navigate(from, { replace: true })
        }
      } catch {
        // Fallback below
      }
    }

    // Create session fallback for instant reader access
    const demoUser = {
      id: `user-${Date.now()}`,
      email: email.trim() || 'reader@mindtrace.io',
      app_metadata: { provider: 'classic' },
      user_metadata: { category: knownCategory, categoryLabel: knownLabel },
      aud: 'authenticated',
      created_at: new Date().toISOString()
    } as unknown as User

    setDemoUserSession(demoUser)
    setBusy(false)
    navigate(from, { replace: true })
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F9F9F7', display: 'grid', placeItems: 'center', padding: '32px 16px', color: '#1A1C1B' }}>
      <div
        style={{
          width: 'min(100%, 1080px)',
          background: '#FFFFFF',
          border: '1px solid var(--border-solid)',
          borderRadius: '24px',
          overflow: 'hidden',
          boxShadow: '0 12px 48px rgba(0,0,0,0.06)',
          display: 'grid',
          gridTemplateColumns: 'repeat(12, 1fr)'
        }}
      >
        {/* Left Atmosphere Panel (5/12 cols) */}
        <div
          style={{
            gridColumn: 'span 5',
            background: '#F4F4F2',
            borderRight: '1px solid var(--border-solid)',
            padding: '48px 36px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}
        >
          <div>
            {/* MindTrace Seal Insignia */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '40px', cursor: 'pointer' }} onClick={() => navigate('/welcome')}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#00153C', color: '#FAE100', display: 'grid', placeItems: 'center' }}>
                <BookOpen size={22} />
              </div>
              <div>
                <span style={{ fontFamily: 'var(--font-serif)', fontSize: '22px', fontWeight: 800, color: '#00153C', letterSpacing: '-0.02em', display: 'block', lineHeight: 1 }}>
                  MindTrace
                </span>
                <span style={{ fontSize: '10px', color: '#747781', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Quiet Academic Portal
                </span>
              </div>
            </div>

            {/* Adler Quotation */}
            <blockquote style={{ margin: '0 0 32px', fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: '16px', lineHeight: 1.65, color: '#00153C' }}>
              “Mỗi trang sách bạn đọc hôm nay là một viên gạch kiến tạo mô hình nhận thức cho tương lai.”
            </blockquote>

            {/* Reader Badge Widget */}
            <div style={{ background: '#FFFFFF', border: '1px solid var(--border-solid)', borderRadius: '14px', padding: '18px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#8A671F', marginBottom: '12px' }}>
                <Feather size={14} /> Màn hồ sơ độc giả mẫu
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '10px' }}>
                <div style={{ position: 'relative', width: '48px', height: '48px', display: 'grid', placeItems: 'center' }}>
                  <svg viewBox="0 0 36 36" style={{ width: '48px', height: '48px', transform: 'rotate(-90deg)' }}>
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#E2E3E1" strokeWidth="3" />
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#185E48" strokeWidth="3" strokeDasharray="83.3, 100" strokeLinecap="round" />
                  </svg>
                  <CheckCircle2 size={16} style={{ position: 'absolute', color: '#185E48' }} />
                </div>
                <div>
                  <div style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'var(--font-serif)', color: '#00153C' }}>83.3%</div>
                  <span style={{ fontSize: '11px', color: '#747781', fontWeight: 600 }}>Tỷ lệ đồng hóa tri thức</span>
                </div>
              </div>
              <div style={{ fontSize: '12px', color: '#444650', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <GitFork size={14} style={{ color: '#00153C' }} /> 24 Cấu trúc nhận thức đã chứng minh
              </div>
            </div>
          </div>

          <div style={{ fontSize: '12px', color: '#747781', marginTop: '32px' }}>
            <p style={{ margin: 0 }}>Cam kết bảo mật tri thức cá nhân • Không lưu vết dữ liệu quảng cáo</p>
          </div>
        </div>

        {/* Right Authentication Form Panel (7/12 cols) */}
        <div style={{ gridColumn: 'span 7', padding: '48px 40px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            {/* Header */}
            <div style={{ marginBottom: '28px' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#8A671F' }}>
                CỔNG TRUY CẬP ĐỘC GIẢ
              </span>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '32px', fontWeight: 800, color: '#00153C', margin: '6px 0 0', letterSpacing: '-0.02em' }}>
                Chào mừng bạn trở lại
              </h2>
            </div>

            {/* Segmented Tab Switcher */}
            <div style={{ background: '#F4F4F2', border: '1px solid var(--border-solid)', borderRadius: '10px', padding: '4px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', marginBottom: '28px' }}>
              <button
                style={{
                  border: 0,
                  borderRadius: '7px',
                  padding: '9px 12px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: activeTab === 'instant' ? '#FFFFFF' : 'transparent',
                  color: activeTab === 'instant' ? '#00153C' : '#747781',
                  boxShadow: activeTab === 'instant' ? '0 2px 6px rgba(0,0,0,0.04)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
                onClick={() => setActiveTab('instant')}
              >
                <Zap size={15} style={{ color: '#D39E00' }} /> 1-Chạm vào ngay (Khuyên dùng)
              </button>
              <button
                style={{
                  border: 0,
                  borderRadius: '7px',
                  padding: '9px 12px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: activeTab === 'classic' ? '#FFFFFF' : 'transparent',
                  color: activeTab === 'classic' ? '#00153C' : '#747781',
                  boxShadow: activeTab === 'classic' ? '0 2px 6px rgba(0,0,0,0.04)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
                onClick={() => setActiveTab('classic')}
              >
                <Mail size={15} /> Email & Mật khẩu
              </button>
            </div>

            {/* TAB 1: Đăng Nhập Nhanh Theo Phân Loại Độc Giả */}
            {activeTab === 'instant' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <p style={{ fontSize: '13px', color: '#444650', margin: '0 0 4px', fontStyle: 'italic' }}>
                  Click vào bất kỳ mục nào bên dưới để chuyển sang bước đăng nhập theo phân loại độc giả:
                </p>

                {/* Profile 1: Gen Z cần yên tĩnh */}
                <div
                  role="button"
                  tabIndex={0}
                  style={{
                    background: '#FFFFFF',
                    border: '1.5px solid var(--border-solid)',
                    borderRadius: '14px',
                    padding: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'all 0.18s ease',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                  }}
                  onClick={() => handleSelectProfile('genz.quiet@mindtrace.io', 'genz', 'Gen Z Tĩnh Lặng')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: '#FFFDF0', color: '#8A671F', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                      <Sparkles size={22} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '15px', color: '#00153C', margin: '0 0 2px' }}>Gen Z cần không gian tĩnh lặng</div>
                      <span style={{ fontSize: '12px', color: '#747781' }}>genz.quiet@mindtrace.io • Đọc sâu không xao nhãng & loại bỏ ảo tưởng</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    style={{
                      background: '#00153C',
                      color: '#FFFFFF',
                      border: 0,
                      borderRadius: '8px',
                      padding: '8px 14px',
                      fontSize: '12px',
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      cursor: 'pointer',
                      flexShrink: 0
                    }}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleSelectProfile('genz.quiet@mindtrace.io', 'genz', 'Gen Z Tĩnh Lặng')
                    }}
                  >
                    Đăng nhập <ArrowRight size={14} />
                  </button>
                </div>

                {/* Profile 2: Khối bận rộn cần deepwork */}
                <div
                  role="button"
                  tabIndex={0}
                  style={{
                    background: '#FFFFFF',
                    border: '1.5px solid var(--border-solid)',
                    borderRadius: '14px',
                    padding: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'all 0.18s ease',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                  }}
                  onClick={() => handleSelectProfile('busy.deepwork@mindtrace.io', 'busy_deepwork', 'Khối Bận Rộn Deep Work')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: '#F4F4F2', color: '#00153C', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                      <Brain size={22} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '15px', color: '#00153C', margin: '0 0 2px' }}>Khối bận rộn cần Deep Work</div>
                      <span style={{ fontSize: '12px', color: '#747781' }}>busy.deepwork@mindtrace.io • Tối ưu nhịp thở đọc nhanh & hồi tưởng</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    style={{
                      background: '#00153C',
                      color: '#FFFFFF',
                      border: 0,
                      borderRadius: '8px',
                      padding: '8px 14px',
                      fontSize: '12px',
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      cursor: 'pointer',
                      flexShrink: 0
                    }}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleSelectProfile('busy.deepwork@mindtrace.io', 'busy_deepwork', 'Khối Bận Rộn Deep Work')
                    }}
                  >
                    Đăng nhập <ArrowRight size={14} />
                  </button>
                </div>

                {/* Profile 3: Độc giả Khảo chứng Nghiên cứu */}
                <div
                  role="button"
                  tabIndex={0}
                  style={{
                    background: '#FFFFFF',
                    border: '1.5px solid var(--border-solid)',
                    borderRadius: '14px',
                    padding: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'all 0.18s ease',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                  }}
                  onClick={() => handleSelectProfile('academic.research@mindtrace.io', 'academic_research', 'Học Giả Nghiên Cứu')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: '#F4F4F2', color: '#185E48', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                      <Lock size={22} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '15px', color: '#00153C', margin: '0 0 2px' }}>Độc giả Khảo chứng Nghiên cứu</div>
                      <span style={{ fontSize: '12px', color: '#747781' }}>academic.research@mindtrace.io • Mô hình tích lũy nhận thức bất biến</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    style={{
                      background: '#00153C',
                      color: '#FFFFFF',
                      border: 0,
                      borderRadius: '8px',
                      padding: '8px 14px',
                      fontSize: '12px',
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      cursor: 'pointer',
                      flexShrink: 0
                    }}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleSelectProfile('academic.research@mindtrace.io', 'academic_research', 'Học Giả Nghiên Cứu')
                    }}
                  >
                    Đăng nhập <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: Đăng nhập bằng Email & Mật khẩu (Classic Form) */}
            {activeTab === 'classic' && (
              <form onSubmit={handleSubmitClassic} className="form-stack">
                {selectedProfileLabel && (
                  <div style={{ background: '#FFFDF0', border: '1px solid #DEC800', borderRadius: '10px', padding: '10px 14px', fontSize: '13px', color: '#504700', marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>⚡ Phân loại đã chọn: <strong>{selectedProfileLabel}</strong> ({email})</span>
                    <button type="button" style={{ border: 0, background: 'transparent', color: '#8A671F', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }} onClick={() => setSelectedProfileLabel(null)}>Thay đổi</button>
                  </div>
                )}
                <div className="field">
                  <label htmlFor="email">Email độc giả</label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nguoiloc@mindtrace.io"
                  />
                </div>

                <div className="field">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label htmlFor="password">Mật khẩu</label>
                    <Link className="forgot-link" style={{ fontSize: '12px' }} to="/forgot-password">
                      Quên mật khẩu?
                    </Link>
                  </div>
                  <div className="password-wrap">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      className="icon-button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                  <input
                    type="checkbox"
                    id="remember"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    style={{ width: 'auto', minHeight: 'auto' }}
                  />
                  <label htmlFor="remember" style={{ color: '#444650', fontWeight: 500, cursor: 'pointer' }}>
                    Ghi nhớ phiên làm việc trên máy tính này
                  </label>
                </div>

                {error && (
                  <div className="status error">
                    {error}
                    {unverified && (
                      <div>
                        <Link to={`/verify-email?email=${encodeURIComponent(email)}`}>Gửi lại email xác minh</Link>
                      </div>
                    )}
                  </div>
                )}

                <button
                  type="submit"
                  className="primary-button"
                  style={{ width: '100%', minHeight: '48px', fontSize: '14px', justifyContent: 'center' }}
                  disabled={busy}
                >
                  {busy ? <LoaderCircle className="spin" size={18} /> : <Lock size={16} />} Đăng nhập độc giả
                </button>
              </form>
            )}
          </div>

          {/* Bottom Footer Links */}
          <div style={{ marginTop: '32px', paddingTop: '20px', borderTop: '1px solid var(--border-solid)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
            <button
              style={{ border: 0, background: 'transparent', color: '#747781', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', padding: 0 }}
              onClick={() => navigate('/welcome')}
            >
              <ArrowLeft size={14} /> Về trang giới thiệu MindTrace
            </button>
            <Link to="/sign-up" style={{ color: '#00153C', fontWeight: 700 }}>
              Khởi tạo miễn phí tức thì →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
