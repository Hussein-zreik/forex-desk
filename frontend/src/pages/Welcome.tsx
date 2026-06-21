import { Link } from 'react-router-dom'
import { Background } from '@/components/Background'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/store/useAuth'

export default function Welcome() {
  const token = useAuth((s) => s.token)
  const primaryHref = token ? '/dashboard' : '/login'

  return (
    <div className="relative min-h-dvh">
      <Background />
      <main className="mx-auto flex min-h-dvh max-w-3xl flex-col items-center justify-center px-6 text-center">
        <Badge>Trader&apos;s command center</Badge>
        <h1 className="mt-6 animate-fade-up bg-gradient-to-b from-foreground to-foreground/60 bg-clip-text text-5xl font-semibold tracking-tight text-transparent sm:text-7xl">
          Forex Desk
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
          Live forex, gold, and macro markets in one cinematic dashboard. Build your own widget
          grid, journal every trade, and track the data that moves price.
        </p>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg">
            <Link to={primaryHref}>{token ? 'Open dashboard' : 'Get started'}</Link>
          </Button>
          {!token && (
            <Button asChild variant="secondary" size="lg">
              <Link to="/register">Create account</Link>
            </Button>
          )}
        </div>
      </main>
    </div>
  )
}
