import { motion, useReducedMotion } from 'framer-motion'
import {
  ArrowRight,
  CalendarClock,
  Check,
  Gauge,
  LayoutGrid,
  type LucideIcon,
  NotebookPen,
  TrendingUp,
} from 'lucide-react'
import { type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Background } from '@/components/Background'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/cn'
import { useAuth } from '@/store/useAuth'

/* ── content ─────────────────────────────────────────────────────────────── */

const FEATURES: {
  icon: LucideIcon
  title: string
  desc: string
  tags: string[]
  span: string
  hero?: boolean
}[] = [
  {
    icon: Gauge,
    title: "Today's Bias",
    desc: 'A single composite directional read, synthesised from six independent signals in real time: macro regime, DXY trend, MTF confluence, currency strength, news sentiment, and real yields. One gauge instead of six tabs.',
    tags: ['Auto · Live', '6 Signals', 'Composite'],
    span: 'lg:col-span-4 lg:row-span-2',
    hero: true,
  },
  {
    icon: LayoutGrid,
    title: 'MTF Confluence Scanner',
    desc: 'EMA 9/21 trend direction across D1, H4, H1 and M15 for the majors and gold — fetched and scored automatically. Know instantly when the timeframes align before you enter.',
    tags: ['4 Timeframes', '5 Pairs', 'Auto-Scan'],
    span: 'lg:col-span-2 lg:row-span-2',
  },
  {
    icon: NotebookPen,
    title: 'Trade Journal & Analytics',
    desc: 'Log every trade with entry, exit, R:R and outcome. Tag mistakes and the analytics surface your recurring patterns: win rate, profit factor, equity curve.',
    tags: ['Analytics', 'Mistake Tags', 'Equity Curve'],
    span: 'lg:col-span-2',
  },
  {
    icon: TrendingUp,
    title: 'Live Prices',
    desc: '30+ instruments — gold, FX majors, indices, crypto, yields — streamed to your dashboard on a tight refresh cycle.',
    tags: ['30+ Symbols', 'Live Stream'],
    span: 'lg:col-span-2',
  },
  {
    icon: CalendarClock,
    title: 'News & Calendar',
    desc: 'Market-moving headlines and the economic calendar, filtered to what actually impacts gold and the dollar.',
    tags: ['High-Impact', 'Curated'],
    span: 'lg:col-span-2',
  },
]

const STEPS = [
  {
    n: 1,
    title: 'Check the Bias',
    desc: 'Open the dashboard and read the composite bias — a single verdict built from six live signals. Bullish, bearish, or neutral: know your lean before the session starts.',
  },
  {
    n: 2,
    title: 'Confirm Confluence',
    desc: 'Cross-reference the MTF scanner. When D1, H4, H1 and M15 agree, the signal is strong. When they diverge, you wait — the grid shows it in one glance.',
  },
  {
    n: 3,
    title: 'Execute & Log',
    desc: 'Place your trade with a defined R:R, then log it in the journal. Over time the analytics reveal your real edge — and your real leaks.',
  },
]

const STATS = [
  { num: '30+', label: 'Live Instruments' },
  { num: '6', label: 'Bias Signals' },
  { num: '50+', label: 'Widgets' },
  { num: 'Free', label: 'Open Source' },
]

const TICKS: [string, string, string, boolean][] = [
  ['XAU/USD', '3,421.80', '+0.54%', true],
  ['EUR/USD', '1.0892', '−0.21%', false],
  ['GBP/USD', '1.2734', '+0.12%', true],
  ['DXY', '104.32', '−0.18%', false],
  ['USD/JPY', '157.84', '+0.31%', true],
  ['XAG/USD', '32.14', '+0.88%', true],
  ['BTC/USD', '67,204', '+1.42%', true],
  ['US10Y', '4.38%', '+0.04%', true],
]

/* ── helpers ─────────────────────────────────────────────────────────────── */

function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode
  className?: string
  delay?: number
}) {
  const reduce = useReducedMotion()
  if (reduce) return <div className={className}>{children}</div>
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay }}
    >
      {children}
    </motion.div>
  )
}

function Shimmer({ children }: { children: ReactNode }) {
  return (
    <span className="animate-shimmer bg-[linear-gradient(90deg,var(--primary),var(--accent-bright),var(--primary))] bg-[length:200%_auto] bg-clip-text text-transparent">
      {children}
    </span>
  )
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="mb-3 text-center font-mono text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
      {children}
    </p>
  )
}

function SectionTitle({ children, id }: { children: ReactNode; id?: string }) {
  return (
    <h2
      id={id}
      className="mx-auto max-w-3xl bg-gradient-to-b from-foreground to-foreground/60 bg-clip-text text-center text-3xl font-semibold tracking-tight text-transparent sm:text-4xl"
    >
      {children}
    </h2>
  )
}

/* ── dashboard preview mock ──────────────────────────────────────────────── */

function DashboardPreview() {
  const cells: [string, string, 'bull' | 'bear' | 'neut'][] = [
    ['D1', '▲ BULL', 'bull'],
    ['H4', '▲ BULL', 'bull'],
    ['H1', '— NEUT', 'neut'],
    ['M15', '▲ BULL', 'bull'],
  ]
  const bars = [60, 80, 45, 70, 30, 85, 55, 65]
  return (
    <div
      aria-hidden
      className="overflow-hidden rounded-2xl border border-border bg-bg-elevated shadow-card-hover transition-transform duration-500 ease-expo [transform:perspective(1100px)_rotateY(-7deg)_rotateX(3deg)] hover:[transform:perspective(1100px)_rotateY(-3deg)_rotateX(1deg)]"
    >
      {/* window chrome */}
      <div className="flex items-center gap-2 border-b border-border bg-bg-deep/60 px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-down/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#f59e0b]/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-up/80" />
        <span className="ml-2 rounded border border-border bg-surface px-2.5 py-0.5 font-mono text-[10px] text-muted-foreground">
          forex-desk · dashboard
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2.5 p-3.5">
        {/* quote tiles */}
        {(
          [
            ['XAU / USD', '3,421.80', '▲ +0.54%', true],
            ['EUR / USD', '1.0892', '▼ −0.21%', false],
          ] as const
        ).map(([sym, price, chg, up]) => (
          <div key={sym} className="rounded-lg border border-border bg-surface px-3.5 py-3">
            <div className="font-mono text-[9px] tracking-widest text-muted-foreground uppercase">
              {sym}
            </div>
            <div className="mt-1 text-xl font-semibold tracking-tight">{price}</div>
            <div className={cn('mt-0.5 font-mono text-[10px]', up ? 'text-up' : 'text-down')}>
              {chg}
            </div>
          </div>
        ))}

        {/* bias panel */}
        <div className="col-span-2 rounded-lg border border-border bg-surface px-3.5 py-3">
          <div className="font-mono text-[9px] tracking-widest text-muted-foreground uppercase">
            Today's Bias — Composite Signal
          </div>
          <div className="relative mt-2 h-1.5 rounded-full bg-[linear-gradient(90deg,var(--down),rgba(120,120,140,0.3)_50%,var(--up))]">
            <span className="absolute top-1/2 left-[68%] h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary bg-white shadow-[0_0_8px_var(--accent-glow)]" />
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="font-mono text-[10px] font-bold text-up">▲ BULLISH</span>
            <span className="font-mono text-[9px] text-muted-foreground">4 / 6 signals bullish</span>
          </div>
          <div className="mt-2 flex h-9 items-end gap-1">
            {bars.map((h, i) => (
              <span
                key={i}
                className={cn(
                  'flex-1 rounded-sm',
                  h >= 50 ? 'bg-up/60' : 'bg-down/40',
                )}
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </div>

        {/* confluence grid */}
        <div className="col-span-2 rounded-lg border border-border bg-surface px-3.5 py-3">
          <div className="mb-2 font-mono text-[9px] tracking-widest text-muted-foreground uppercase">
            MTF Confluence — XAU/USD
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {cells.map(([tf, dir, kind]) => (
              <div
                key={tf}
                className={cn(
                  'rounded border px-1.5 py-1 text-center',
                  kind === 'bull' && 'border-up/20 bg-up/10',
                  kind === 'bear' && 'border-down/20 bg-down/10',
                  kind === 'neut' && 'border-border bg-surface-hover',
                )}
              >
                <div className="font-mono text-[7px] tracking-wide text-muted-foreground">{tf}</div>
                <div
                  className={cn(
                    'mt-0.5 font-mono text-[8px] font-bold',
                    kind === 'bull' && 'text-up',
                    kind === 'bear' && 'text-down',
                    kind === 'neut' && 'text-muted-foreground',
                  )}
                >
                  {dir}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── page ────────────────────────────────────────────────────────────────── */

export default function Welcome() {
  const token = useAuth((s) => s.token)
  const primaryHref = token ? '/dashboard' : '/register'
  const primaryLabel = token ? 'Open dashboard' : 'Get started'

  return (
    <div className="relative min-h-dvh overflow-x-hidden">
      <Background />

      {/* header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-5">
          <Link to="/" className="flex items-center gap-2.5" aria-label="Forex Desk home">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-xs font-bold text-primary-foreground shadow-cta">
              FX
            </span>
            <span className="font-semibold tracking-tight">Forex Desk</span>
          </Link>
          <div className="ml-auto flex items-center gap-2">
            {token ? (
              <Button asChild size="sm" className="max-sm:h-11 max-sm:px-4">
                <Link to="/dashboard">Open dashboard</Link>
              </Button>
            ) : (
              <>
                <Button asChild size="sm" variant="ghost" className="max-sm:h-11 max-sm:px-4">
                  <Link to="/login">Log in</Link>
                </Button>
                <Button asChild size="sm" className="max-sm:h-11 max-sm:px-4">
                  <Link to="/register">Get started</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main>
        {/* hero */}
        <section className="relative mx-auto max-w-6xl px-5 pt-16 pb-20 sm:pt-24">
          <div className="grid items-center gap-14 lg:grid-cols-2">
            <div className="animate-fade-up text-center lg:text-left">
              <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3.5 py-1.5 font-mono text-[11px] tracking-[0.12em] text-foreground-subtle uppercase">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary shadow-[0_0_8px_var(--accent-glow)]" />
                Live · streaming market data
              </div>
              <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-6xl">
                <span className="bg-gradient-to-b from-foreground to-foreground/60 bg-clip-text text-transparent">
                  Your edge in{' '}
                </span>
                <Shimmer>gold &amp; forex</Shimmer>
                <span className="bg-gradient-to-b from-foreground to-foreground/60 bg-clip-text text-transparent">
                  {' '}
                  starts here.
                </span>
              </h1>
              <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground lg:mx-0">
                Forex Desk aggregates live prices, macro signals, multi-timeframe confluence, and
                your own trade journal into one cinematic command center — so you spend less time
                gathering data and more time making decisions.
              </p>
              <div className="mt-9 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
                <Button asChild size="lg">
                  <Link to={primaryHref}>
                    {primaryLabel}
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </Link>
                </Button>
                {!token && (
                  <Button asChild size="lg" variant="secondary">
                    <Link to="/login">Log in</Link>
                  </Button>
                )}
              </div>
              <div className="mt-10 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 lg:justify-start">
                {['Customizable widget grid', 'Server-side indicators', '30+ live instruments'].map(
                  (t) => (
                    <span
                      key={t}
                      className="flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground"
                    >
                      <Check className="h-3 w-3 text-up" aria-hidden />
                      {t}
                    </span>
                  ),
                )}
              </div>
            </div>

            <div className="hidden lg:block">
              <DashboardPreview />
            </div>
          </div>
        </section>

        {/* ticker strip */}
        <div className="overflow-hidden border-y border-border bg-bg-elevated/40 py-3" aria-hidden>
          <div className="flex w-max animate-ticker gap-10">
            {[...TICKS, ...TICKS].map(([sym, price, chg, up], i) => (
              <span key={i} className="flex items-center gap-2 font-mono text-xs whitespace-nowrap">
                <span className="font-semibold text-muted-foreground">{sym}</span>
                <span>{price}</span>
                <span className={up ? 'text-up' : 'text-down'}>{chg}</span>
              </span>
            ))}
          </div>
        </div>

        {/* features */}
        <section className="mx-auto max-w-6xl px-5 py-24" aria-labelledby="features-title">
          <Reveal>
            <SectionLabel>What's inside</SectionLabel>
            <SectionTitle id="features-title">
              Everything a serious <Shimmer>trader</Shimmer> needs
            </SectionTitle>
            <p className="mx-auto mt-4 max-w-xl text-center leading-relaxed text-muted-foreground">
              No bloat, no paywalls, no distractions — just the signals that move the market.
            </p>
          </Reveal>

          <div className="mt-14 grid gap-4 lg:grid-cols-6 lg:grid-rows-[repeat(3,minmax(180px,auto))]">
            {FEATURES.map((f, i) => {
              const Icon = f.icon
              return (
                <Reveal
                  key={f.title}
                  delay={i * 0.05}
                  className={cn(
                    'group flex flex-col rounded-2xl border border-border bg-gradient-to-b from-surface to-surface/10 p-7 shadow-card transition-[transform,box-shadow,border-color] duration-300 ease-expo hover:-translate-y-1 hover:border-border-hover hover:shadow-card-hover',
                    f.span,
                  )}
                >
                  <div className="mb-5 grid h-11 w-11 place-items-center rounded-xl border border-border-hover bg-surface shadow-inner-top">
                    <Icon className="h-5 w-5 text-primary" aria-hidden />
                  </div>
                  <h3
                    className={cn(
                      'font-semibold tracking-tight',
                      f.hero ? 'text-2xl' : 'text-lg',
                    )}
                  >
                    {f.title}
                  </h3>
                  <p className="mt-2.5 max-w-prose text-base leading-relaxed text-muted-foreground sm:text-sm">
                    {f.desc}
                  </p>
                  <div className="mt-auto flex flex-wrap gap-2 pt-6">
                    {f.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded-full border border-border bg-surface px-2.5 py-1 font-mono text-[10px] tracking-wide text-muted-foreground uppercase"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                  {f.hero && (
                    <div className="mt-6 flex h-16 items-end gap-1.5" aria-hidden>
                      {[58, 80, 44, 72, 34, 88, 56, 66, 48, 78, 40, 84].map((h, j) => (
                        <span
                          key={j}
                          className="flex-1 rounded-t bg-gradient-to-t from-primary/50 to-primary/10"
                          style={{ height: `${h}%` }}
                        />
                      ))}
                    </div>
                  )}
                </Reveal>
              )
            })}
          </div>
        </section>

        {/* how it works */}
        <section
          className="border-y border-border bg-bg-elevated/40 py-24"
          aria-labelledby="how-title"
        >
          <div className="mx-auto max-w-5xl px-5">
            <Reveal>
              <SectionLabel>Workflow</SectionLabel>
              <SectionTitle id="how-title">
                From data to <Shimmer>decision</Shimmer> in seconds
              </SectionTitle>
            </Reveal>
            <div className="mt-14 grid gap-10 sm:grid-cols-3">
              {STEPS.map((s, i) => (
                <Reveal key={s.n} delay={i * 0.08} className="text-center">
                  <div className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-border-hover bg-gradient-to-b from-surface to-surface/10 text-xl font-semibold text-primary shadow-inner-top">
                    {s.n}
                  </div>
                  <h3 className="mt-6 text-lg font-semibold tracking-tight">{s.title}</h3>
                  <p className="mt-2.5 text-base leading-relaxed text-muted-foreground sm:text-sm">
                    {s.desc}
                  </p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* stats */}
        <section className="mx-auto max-w-5xl px-5 py-20" aria-label="Platform statistics">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {STATS.map((s, i) => (
              <Reveal
                key={s.label}
                delay={i * 0.06}
                className="rounded-2xl border border-border bg-gradient-to-b from-surface to-surface/10 p-7 text-center shadow-card"
              >
                <div className="bg-gradient-to-b from-foreground to-foreground/60 bg-clip-text text-3xl font-semibold tracking-tight text-transparent sm:text-4xl">
                  {s.num}
                </div>
                <div className="mt-2 font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
                  {s.label}
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* cta band */}
        <section className="relative px-5 py-24" aria-labelledby="cta-title">
          <div className="pointer-events-none absolute top-1/2 left-1/2 h-[500px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,var(--accent-glow),transparent_65%)]" />
          <Reveal className="relative mx-auto max-w-2xl rounded-3xl border border-border-hover bg-gradient-to-b from-surface to-surface/10 px-8 py-14 text-center shadow-card-hover">
            <h2
              id="cta-title"
              className="bg-gradient-to-b from-foreground to-foreground/60 bg-clip-text text-3xl font-semibold tracking-tight text-transparent sm:text-4xl"
            >
              Ready to trade with a <Shimmer>cleaner edge?</Shimmer>
            </h2>
            <p className="mx-auto mt-4 max-w-md leading-relaxed text-muted-foreground">
              The dashboard is live and ready. Build your widget grid, journal every trade, and track
              the data that moves price.
            </p>
            <div className="mt-8 flex justify-center">
              <Button asChild size="lg">
                <Link to={primaryHref}>
                  {primaryLabel}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </Reveal>
        </section>

        {/* footer */}
        <footer className="border-t border-border bg-bg-deep/60 px-5 py-12">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
            <div className="flex items-center gap-2.5">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary text-[10px] font-bold text-primary-foreground">
                FX
              </span>
              <span className="font-semibold tracking-tight">Forex Desk</span>
            </div>
            <p className="max-w-md font-mono text-[11px] leading-relaxed text-muted-foreground">
              For informational purposes only — not financial advice. Trading carries significant
              risk.
            </p>
            <p className="font-mono text-[11px] text-muted-foreground">© 2026 Forex Desk</p>
          </div>
        </footer>
      </main>
    </div>
  )
}
