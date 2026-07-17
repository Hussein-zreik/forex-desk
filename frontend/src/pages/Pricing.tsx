import { Check } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Background } from '@/components/Background'
import { Footer } from '@/components/Footer'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useMeta } from '@/hooks/useMeta'
import { api } from '@/lib/api'
import { useAuth } from '@/store/useAuth'

interface BillingStatus {
  configured: boolean
  plan: 'free' | 'pro'
}

const FREE_FEATURES = [
  'Full live dashboard — 50+ widgets',
  'Composite bias + track record',
  '3 active price alerts (Telegram)',
  'Journal with 90-day history',
  'MT4/MT5 statement import',
]

const PRO_FEATURES = [
  'Everything in Free',
  'Unlimited price alerts',
  'Email alert delivery',
  'Unlimited journal history',
  'Priority for upcoming Pro features',
]

function FeatureList({ items }: { items: string[] }) {
  return (
    <ul className="mt-4 space-y-2">
      {items.map((f) => (
        <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
          <Check className="mt-0.5 h-4 w-4 shrink-0 text-up" aria-hidden />
          {f}
        </li>
      ))}
    </ul>
  )
}

export default function Pricing() {
  useMeta(
    'Pricing — Forex Desk',
    'Free forever for the full dashboard; Pro unlocks unlimited alerts, email delivery and unlimited journal history.',
  )
  const token = useAuth((s) => s.token)
  const [params] = useSearchParams()
  const upgraded = params.get('upgraded') === '1'
  const [status, setStatus] = useState<BillingStatus | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    api<BillingStatus>('/api/billing/status')
      .then(setStatus)
      .catch(() => {})
  }, [token, upgraded])

  async function go(path: 'checkout' | 'portal') {
    setBusy(true)
    setError(null)
    try {
      const { url } = await api<{ url: string }>(`/api/billing/${path}`, { method: 'POST' })
      window.location.href = url
    } catch {
      setError('Could not open billing — try again in a moment.')
      setBusy(false)
    }
  }

  const proAction = !token ? (
    <Button asChild className="mt-6 w-full">
      <Link to="/register">Start free, upgrade anytime</Link>
    </Button>
  ) : status?.plan === 'pro' ? (
    <Button className="mt-6 w-full" variant="secondary" loading={busy} onClick={() => go('portal')}>
      Manage billing
    </Button>
  ) : status?.configured ? (
    <Button className="mt-6 w-full" loading={busy} onClick={() => go('checkout')}>
      Upgrade to Pro
    </Button>
  ) : (
    <p className="mt-6 text-center text-xs text-muted-foreground">
      Billing isn&rsquo;t enabled on this server yet.
    </p>
  )

  return (
    <div className="relative min-h-dvh">
      <Background />
      <main className="mx-auto max-w-4xl px-5 py-14">
        <h1 className="text-center text-3xl font-semibold tracking-tight sm:text-4xl">
          Simple pricing
        </h1>
        <p className="mx-auto mt-3 max-w-md text-center text-muted-foreground">
          The whole desk is free. Pro removes the limits when your process outgrows them.
        </p>
        {upgraded && (
          <p
            role="status"
            className="mx-auto mt-4 w-fit rounded-lg border border-up/30 bg-up/10 px-3 py-1.5 text-sm text-up"
          >
            Welcome to Pro — your limits are gone. 🎉
          </p>
        )}
        {error && (
          <p role="alert" className="mt-4 text-center text-sm text-destructive">
            {error}
          </p>
        )}

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          <Card className="p-7">
            <Badge>Free</Badge>
            <div className="mt-3 font-mono text-3xl font-semibold">
              $0<span className="text-sm text-muted-foreground"> / forever</span>
            </div>
            <FeatureList items={FREE_FEATURES} />
            <Button asChild variant="secondary" className="mt-6 w-full">
              <Link to={token ? '/dashboard' : '/register'}>
                {token ? 'Open your desk' : 'Get started free'}
              </Link>
            </Button>
          </Card>

          <Card className="border-border-accent p-7">
            <Badge className="border-border-accent">Pro</Badge>
            <div className="mt-3 font-mono text-3xl font-semibold">
              $9<span className="text-sm text-muted-foreground"> / month</span>
            </div>
            <FeatureList items={PRO_FEATURES} />
            {proAction}
          </Card>
        </div>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          Cancel anytime from the billing portal — you keep your data either way.
        </p>
      </main>
      <Footer />
    </div>
  )
}
