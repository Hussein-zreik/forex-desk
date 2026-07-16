import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { Background } from '@/components/Background'
import { Navbar } from '@/components/Navbar'
import { Sidebar } from '@/components/Sidebar'
import { BottomNav } from '@/components/BottomNav'
import { Footer } from '@/components/Footer'
import { VerifyEmailBanner } from '@/components/VerifyEmailBanner'
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
      <a
        href="#main-content"
        className="sr-only z-50 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground focus:not-sr-only focus:absolute focus:top-4 focus:left-4"
      >
        Skip to content
      </a>
      <Background />
      <Navbar />
      <VerifyEmailBanner />
      <TickerWidget />
      {/* pb clears the fixed BottomNav on phones. */}
      <div className="mx-auto flex max-w-[1600px] gap-6 px-4 py-6 pb-20 md:pb-6">
        <main id="main-content" tabIndex={-1} className="min-w-0 flex-1 focus:outline-none">
          <Outlet />
        </main>
        <Sidebar />
      </div>
      <Footer />
      <BottomNav />
    </div>
  )
}
