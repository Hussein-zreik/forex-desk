import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { Background } from '@/components/Background'
import { Navbar } from '@/components/Navbar'
import { Sidebar } from '@/components/Sidebar'
import { TickerWidget } from '@/pages/Dashboard/widgets/TickerWidget'
import { useAuth } from '@/store/useAuth'

export function AppLayout() {
  const token = useAuth((s) => s.token)
  const user = useAuth((s) => s.user)
  const loadMe = useAuth((s) => s.loadMe)

  useEffect(() => {
    if (token && !user) loadMe().catch(() => {})
  }, [token, user, loadMe])

  return (
    <div className="relative min-h-dvh">
      <Background />
      <Navbar />
      <TickerWidget />
      <div className="mx-auto flex max-w-[1600px] gap-6 px-4 py-6">
        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
        <Sidebar />
      </div>
    </div>
  )
}
