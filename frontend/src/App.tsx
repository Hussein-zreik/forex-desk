import { lazy, Suspense, useEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from '@/components/AppLayout'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { RouteFallback } from '@/components/RouteFallback'
import { setOnUnauthorized } from '@/lib/api'
import { useAuth } from '@/store/useAuth'
import { useSettings } from '@/store/useSettings'

// Route-level code splitting: each page (and its heavy deps such as
// recharts and react-grid-layout) loads on demand.
const Welcome = lazy(() => import('@/pages/Welcome'))
const Login = lazy(() => import('@/pages/auth/Login'))
const Register = lazy(() => import('@/pages/auth/Register'))
const ForgotPassword = lazy(() => import('@/pages/auth/ForgotPassword'))
const ResetPassword = lazy(() => import('@/pages/auth/ResetPassword'))
const VerifyEmail = lazy(() => import('@/pages/auth/VerifyEmail'))
const Terms = lazy(() => import('@/pages/legal/Terms'))
const Privacy = lazy(() => import('@/pages/legal/Privacy'))
const RiskDisclaimer = lazy(() => import('@/pages/legal/RiskDisclaimer'))
const Dashboard = lazy(() => import('@/pages/Dashboard/Dashboard'))
const Portfolio = lazy(() => import('@/pages/Portfolio'))
const Journal = lazy(() => import('@/pages/Journal'))
const Learning = lazy(() => import('@/pages/Learning'))
const Calendar = lazy(() => import('@/pages/Calendar'))

function App() {
  const theme = useSettings((s) => s.theme)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  useEffect(() => {
    setOnUnauthorized(() => useAuth.getState().logout())
  }, [])

  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/disclaimer" element={<RiskDisclaimer />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/journal" element={<Journal />} />
            <Route path="/learn" element={<Learning />} />
            <Route path="/calendar" element={<Calendar />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}

export default App
