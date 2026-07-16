import { ArrowRight, Eye } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Background } from '@/components/Background'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { TickerWidget } from '@/pages/Dashboard/widgets/TickerWidget'
import { WIDGETS } from '@/pages/Dashboard/widgets/registry'

/**
 * Public read-only demo — real live data, no account.
 *
 * Every widget here talks only to the public market/widget endpoints (the
 * whole widget API is unauthenticated, and the shared server cache means demo
 * visitors add no upstream load). User-data features (alerts, journal,
 * portfolio) are represented by a sign-up CTA instead. The layout is fixed:
 * customizing is the product's hook, so that's what the CTA sells.
 */

const DEMO_WIDGETS: { type: string; span?: string }[] = [
  { type: 'gold' },
  { type: 'eurusd' },
  { type: 'dxy' },
  { type: 'bias', span: 'md:row-span-2' },
  { type: 'sessions', span: 'md:row-span-2' },
  { type: 'fearGreed' },
  { type: 'news', span: 'md:row-span-2' },
  { type: 'biasTrackRecord' },
]

function CtaCard() {
  return (
    <Card className="flex h-full flex-col items-center justify-center gap-3 border-border-accent text-center">
      <p className="text-sm font-semibold tracking-tight">
        Price alerts, journal &amp; portfolio live in your account
      </p>
      <p className="max-w-[16rem] text-xs leading-relaxed text-muted-foreground">
        Create a free account to customize this grid, set Telegram alerts and track your own
        trading stats.
      </p>
      <Button asChild size="sm">
        <Link to="/register">
          Sign up free <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </Button>
    </Card>
  )
}

export default function Demo() {
  return (
    <div className="relative min-h-dvh">
      <Background />

      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-[1600px] items-center gap-3 px-4">
          <Link to="/" className="flex items-center gap-2" aria-label="Forex Desk home">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary text-primary-foreground shadow-cta">
              <span className="font-mono text-[11px] font-bold">FX</span>
            </span>
            <span className="text-sm font-semibold tracking-tight">Forex Desk</span>
          </Link>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-1 font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
            <Eye className="h-3 w-3" aria-hidden /> Live demo
          </span>
          <div className="ml-auto flex items-center gap-2">
            <Button asChild size="sm" variant="ghost">
              <Link to="/login">Log in</Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/register">Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      <TickerWidget />

      <div
        role="status"
        className="border-b border-border bg-surface px-4 py-2 text-center text-xs text-muted-foreground"
      >
        You&rsquo;re viewing the live demo — the data is real, the layout is fixed. Create a free
        account to rearrange widgets and save your own desk.
      </div>

      <main className="mx-auto max-w-[1600px] px-4 py-6">
        <div className="grid auto-rows-[280px] grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {DEMO_WIDGETS.map(({ type, span }) => {
            const def = WIDGETS[type]
            if (!def) return null
            return (
              <div key={type} className={span}>
                {def.render({ editMode: false, onRemove: () => {} }, undefined)}
              </div>
            )
          })}
          <CtaCard />
        </div>
      </main>
    </div>
  )
}
