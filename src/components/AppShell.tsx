import { useState } from 'react'
import {
  BookOpen,
  Brain,
  ChevronUp,
  FileUp,
  Home,
  Info,
  Library,
  LogOut,
  Map,
  Settings,
  Sparkles,
  UserCheck
} from 'lucide-react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { supabase } from '../lib/supabase'

const nav = [
  { to: '/today', label: 'Hôm nay', icon: Home },
  { to: '/library', label: 'Thư viện', icon: Library },
  { to: '/knowledge', label: 'Bản đồ hiểu biết', icon: Map },
  { to: '/welcome', label: 'Giới thiệu MindTrace', icon: Info },
]

export function AppShell() {
  const navigate = useNavigate()
  const { user, setDemoUserSession } = useAuth()
  const [accountMenuOpen, setAccountMenuOpen] = useState(false)

  async function signOut() {
    setDemoUserSession(null)
    await supabase.auth.signOut()
    navigate('/sign-in', { replace: true })
  }

  const activeEmail = user?.email || 'reader@mindtrace.io'

  return (
    <div className="app-layout">
      <aside className="sidebar">
        {/* Brand logo link to Welcome page */}
        <div
          className="brand"
          style={{ cursor: 'pointer' }}
          onClick={() => navigate('/welcome')}
          title="Xem trang giới thiệu MindTrace"
        >
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#00153C', color: '#FAE100', display: 'grid', placeItems: 'center' }}>
            <BookOpen size={18} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', fontWeight: 800, color: '#00153C', lineHeight: 1 }}>
              MindTrace
            </span>
            <span style={{ fontSize: '9px', color: '#747781', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '2px' }}>
              Quiet Academic
            </span>
          </div>
        </div>

        <div style={{ marginTop: '24px', marginBottom: '8px' }}>
          <button
            className="primary-button"
            style={{ width: '100%', minHeight: '42px', fontSize: '13px' }}
            onClick={() => navigate('/library?upload=true')}
          >
            <FileUp size={16} /> Tải PDF lên
          </button>
        </div>

        <nav>
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to}>
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Reader Account Switcher & Foot */}
        <div className="sidebar-foot" style={{ position: 'relative' }}>
          {/* Account Menu Popover */}
          {accountMenuOpen && (
            <div
              style={{
                position: 'absolute',
                bottom: '100%',
                left: 0,
                right: 0,
                marginBottom: '8px',
                background: '#FFFFFF',
                border: '1px solid var(--border-solid)',
                borderRadius: '12px',
                padding: '8px',
                boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                zIndex: 40,
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}
            >
              <div style={{ padding: '6px 8px', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#747781' }}>
                Chuyển đổi hồ sơ độc giả
              </div>
              <button
                style={{ width: '100%', border: 0, background: '#F4F4F2', borderRadius: '7px', padding: '8px 10px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 700, color: '#00153C', cursor: 'pointer' }}
                onClick={() => {
                  setAccountMenuOpen(false)
                  navigate('/today')
                }}
              >
                <Brain size={15} style={{ color: '#00153C' }} />
                <span>Nghiên cứu sinh</span>
              </button>
              <button
                style={{ width: '100%', border: 0, background: 'transparent', borderRadius: '7px', padding: '8px 10px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 600, color: '#444650', cursor: 'pointer' }}
                onClick={() => {
                  setAccountMenuOpen(false)
                  navigate('/today')
                }}
              >
                <Sparkles size={15} style={{ color: '#8A671F' }} />
                <span>Học giả Triết học</span>
              </button>
              <div style={{ borderTop: '1px solid var(--border-solid)', margin: '4px 0' }} />
              <button
                style={{ width: '100%', border: 0, background: 'transparent', borderRadius: '7px', padding: '8px 10px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#444650', cursor: 'pointer' }}
                onClick={() => {
                  setAccountMenuOpen(false)
                  navigate('/settings')
                }}
              >
                <Settings size={15} />
                <span>Cài đặt tài khoản</span>
              </button>
              <button
                style={{ width: '100%', border: 0, background: 'transparent', borderRadius: '7px', padding: '8px 10px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#A4433F', cursor: 'pointer' }}
                onClick={() => void signOut()}
              >
                <LogOut size={15} />
                <span>Đăng xuất</span>
              </button>
            </div>
          )}

          {/* Active Reader Card Widget */}
          <button
            style={{
              width: '100%',
              border: '1px solid var(--border-solid)',
              borderRadius: '10px',
              background: '#FFFFFF',
              padding: '10px 12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '8px',
              cursor: 'pointer',
              marginBottom: '6px'
            }}
            onClick={() => setAccountMenuOpen((v) => !v)}
            title="Chuyển đổi hồ sơ hoặc Cài đặt"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
              <UserCheck size={16} style={{ color: '#00153C', flex: 'none' }} />
              <div style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'left' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#00153C', display: 'block' }}>Độc giả</span>
                <span style={{ fontSize: '10px', color: '#747781', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis' }}>{activeEmail}</span>
              </div>
            </div>
            <ChevronUp size={14} style={{ color: '#747781', transform: accountMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }} />
          </button>
        </div>
      </aside>

      <main className="app-main">
        <Outlet />
      </main>

      <nav className="bottom-nav">
        {nav.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to}>
            <Icon size={20} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}


