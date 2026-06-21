import { useEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from '@/components/AppLayout'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { setOnUnauthorized } from '@/lib/api'
import Calendar from '@/pages/Calendar'
import Dashboard from '@/pages/Dashboard/Dashboard'
import Journal from '@/pages/Journal'
import Learning from '@/pages/Learning'
import Portfolio from '@/pages/Portfolio'
import Welcome from '@/pages/Welcome'
import Login from '@/pages/auth/Login'
import Register from '@/pages/auth/Register'
import { useAuth } from '@/store/useAuth'
import { useSettings } from '@/store/useSettings'

function App() {
  const theme = useSettings((s) => s.theme)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  useEffect(() => {
    setOnUnauthorized(() => useAuth.getState().logout())
  }, [])

  return (
    <Routes>
      <Route path="/" element={<Welcome />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
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
  )
}

export default App
