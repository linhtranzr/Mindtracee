import { BookOpen, Home, Library, LogOut, Map, Settings } from 'lucide-react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const nav = [{ to: '/today', label: 'Hôm nay', icon: Home }, { to: '/library', label: 'Thư viện', icon: Library }, { to: '/knowledge', label: 'Bản đồ hiểu biết', icon: Map }]
export function AppShell() {
  const navigate = useNavigate()
  async function signOut() { await supabase.auth.signOut(); navigate('/sign-in', { replace: true }) }
  return <div className="app-layout">
    <aside className="sidebar"><a className="brand" href="/today"><BookOpen size={21} /> MindTrace</a><nav>{nav.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to}><Icon size={19} />{label}</NavLink>)}</nav><div className="sidebar-foot"><NavLink to="/settings"><Settings size={19} />Cài đặt</NavLink><button onClick={signOut}><LogOut size={19} />Đăng xuất</button></div></aside>
    <main className="app-main"><Outlet /></main>
    <nav className="bottom-nav">{nav.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to}><Icon size={20} /><span>{label}</span></NavLink>)}</nav>
  </div>
}
