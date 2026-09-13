import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { LoaderCircle } from 'lucide-react'
import { useAuth } from './auth/AuthProvider'
import { AppShell } from './components/AppShell'
import { AuthCallback } from './pages/AuthCallback'
import { ForgotPassword } from './pages/ForgotPassword'
import { Knowledge, Settings, Today } from './pages/AppPages'
import { Library } from './pages/Library'
import { Reflection } from './pages/Reflection'
import { ResetPassword } from './pages/ResetPassword'
import { Review } from './pages/Review'
import { SignIn } from './pages/SignIn'
import { SignUp } from './pages/SignUp'
import { VerifyEmail } from './pages/VerifyEmail'

const Reader = lazy(() => import('./pages/Reader').then((m) => ({ default: m.Reader })))

function ReaderFallback() {
  return (
    <div className="reader-loading">
      <LoaderCircle className="spin" size={28} />
      <p>Đang tải trình đọc sách MindTrace…</p>
    </div>
  )
}

function Protected() {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <main className="center-screen">Đang khôi phục phiên đăng nhập…</main>
  if (!user) return <Navigate to="/sign-in" replace state={{ from: location.pathname }} />
  if (!user.email_confirmed_at) return <Navigate to={`/verify-email?email=${encodeURIComponent(user.email || '')}`} replace />
  return <AppShell />
}

export default function App() {
  return (
    <Routes>
      <Route path="/sign-up" element={<SignUp />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/sign-in" element={<SignIn />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route element={<Protected />}>
        <Route path="/today" element={<Today />} />
        <Route path="/library" element={<Library />} />
        <Route
          path="/reader/:documentId"
          element={
            <Suspense fallback={<ReaderFallback />}>
              <Reader />
            </Suspense>
          }
        />
        <Route path="/reflection/:documentId" element={<Reflection />} />
        <Route path="/review/:topicId" element={<Review />} />
        <Route path="/knowledge" element={<Knowledge />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/today" replace />} />
    </Routes>
  )
}
