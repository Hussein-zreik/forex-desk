import { motion, useInView, useReducedMotion } from 'framer-motion'
import {
  ArrowRight,
  Check,
  Gauge,
  Layers,
  type LucideIcon,
  NotebookPen,
  Quote,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Star,
  TrendingUp,
} from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Background } from '@/components/Background'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/cn'
import { useAuth } from '@/store/useAuth'

/* ── content ─────────────────────────────────────────────────────────────── */

const FEATURES: { icon: LucideIcon; title: string; desc: string }[] = [
  {
    icon: Gauge,
    title: 'Composite bias',
    desc: 'Six independent signals — macro regime, DXY, MTF confluence, currency strength, news, real yields — fused into one directional read.',
  },
  {
    icon: Layers,
    title: 'MTF confluence',
    desc: 'EMA trend across D1, H4, H1 and M15 for the majors and gold, scored automatically so you only enter when the timeframes agree.',
  },
  {
    icon: NotebookPen,
    title: 'Journal & analytics',
    desc: 'Log every trade, tag your mistakes, and watch your win rate, profit factor and equity curve surface the patterns that cost you.',
  },
  {
    icon: SlidersHorizontal,
    title: 'Your own dashboard',
    desc: 'Drag, drop and resize 50+ widgets into a layout that fits how you trade. It saves itself, per account.',
  },
]

const STATS: { to?: number; suffix?: string; text?: string; label: string }[] = [
  { to: 30, suffix: '+', label: 'Live instruments' },
  { to: 6, label: 'Signals fused into bias' },
  { to: 50, suffix: '+', label: 'Dashboard widgets' },
  { text: 'Free', label: 'Open source, forever' },
]

const TESTIMONIALS: { quote: string; name: string; role: string; stars: number; tint: string }[] = [
  {
    quote:
      'The composite bias gauge replaced four of my morning tabs. I read it at the open and I already know my lean before I touch a chart.',
    name: 'Marcus T.',
    role: 'Retail FX trader · 6 yrs',
    stars: 5,
    tint: 'primary',
  },
  {
    quote:
      'The MTF confluence grid is the feature I didn’t know I needed. When the timeframes align I size up with confidence; when they don’t, I wait.',
    name: 'Sara K.',
    role: 'Gold & commodities',
    stars: 5,
    tint: 'up',
  },
  {
    quote:
      'Tagging my journal mistakes for two weeks exposed a FOMO habit that was quietly wrecking my profit factor. That insight alone paid for itself.',
    name: 'Rami A.',
    role: 'Prop firm trader',
    stars: 5,
    tint: 'down',
  },
  {
    quote:
      'Everything I check pre-session finally lives on one screen. Less tab-hopping, more discipline — exactly what I needed.',
    name: 'Elena V.',
    role: 'Swing trader',
    stars: 5,
    tint: 'primary',
  },
  {
    quote:
      'Fast, clean, and the data I actually trade off of. The dark UI is genuinely easy on the eyes through the London–NY overlap.',
    name: 'Daniel O.',
    role: 'Intraday trader',
    stars: 4,
    tint: 'up',
  },
  {
    quote:
      'I rebuilt my whole widget layout in five minutes. It feels like a terminal I’d happily pay for — and it’s free.',
    name: 'Priya N.',
    role: 'Macro trader',
    stars: 5,
    tint: 'primary',
  },
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

const TINT: Record<string, string> = {
  primary: 'bg-primary/15 text-primary',
  up: 'bg-up/15 text-up',
  down: 'bg-down/15 text-down',
}

/* ── motion helpers ──────────────────────────────────────────────────────── */

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
    <span className="animate-shimmer bg-[linear-gradient(90deg,var(--primary),var(--accent-bright),#a5b4fc,var(--primary))] bg-[length:200%_auto] bg-clip-text text-transparent">
      {children}
    </span>
  )
}

/** Count-up number that animates the first time it scrolls into view. */
function Counter({ to, suffix = '' }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-15% 0px' })
  const reduce = useReducedMotion()
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (!inView || reduce) return
    let raf = 0
    const start = performance.now()
    const dur = 1100
    const tick = (t: number) => {
      const p = Math.min((t - start) / dur, 1)
      setVal(Math.round(to * (1 - Math.pow(1 - p, 3))))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [inView, reduce, to])
  return (
    <span ref={ref}>
      {reduce ? to : val}
      {suffix}
    </span>
  )
}

function Stars({ n }: { n: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${n} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          aria-hidden
          className={cn('h-3.5 w-3.5', i < n ? 'fill-[#f5b301] text-[#f5b301]' : 'text-border')}
        />
      ))}
    </div>
  )
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="mb-3 text-center font-mono text-xs font-medium tracking-[0.2em] text-primary uppercase">
      {children}
    </p>
  )
}

function SectionTitle({ children, id }: { children: ReactNode; id?: string }) {
  return (
    <h2
      id={id}
      className="mx-auto max-w-2xl bg-gradient-to-b from-foreground to-foreground/55 bg-clip-text text-center text-3xl font-semibold tracking-tight text-transparent sm:text-4xl"
    >
      {children}
    </h2>
  )
}

/* ── hero "live signal" visual ───────────────────────────────────────────── */

const HERO_PRICES = ['3,418.90', '3,421.80', '3,424.10', '3,422.40', '3,419.60']
const HERO_LINE = 'M0,72 L34,64 L68,68 L102,50 L136,55 L170,38 L204,43 L238,26 L272,31 L306,17 L340,22'

function HeroVisual() {
  const reduce = useReducedMotion()
  const [pi, setPi] = useState(1)
  useEffect(() => {
    if (reduce) return
    const id = setInterval(() => setPi((p) => (p + 1) % HERO_PRICES.length), 2200)
    return () => clearInterval(id)
  }, [reduce])

  return (
    <motion.div
      className="relative w-full max-w-md"
      initial={reduce ? false : { opacity: 0, y: 30, scale: 0.97 }}
      animate={reduce ? {} : { opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
    >
      <motion.div
        animate={reduce ? {} : { y: [0, -10, 0] }}
        transition={{ duration: 7, ease: 'easeInOut', repeat: Infinity }}
        className="overflow-hidden rounded-3xl border border-border bg-gradient-to-b from-surface to-surface/10 p-5 shadow-card-hover backdrop-blur-xl"
      >
        {/* live quote */}
        <div className="flex items-center justify-between">
          <div>
            <div className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
              XAU / USD · Gold
            </div>
            <div className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">
              {HERO_PRICES[pi]}
            </div>
          </div>
          <div className="flex items-center gap-1 rounded-full bg-up/15 px-2.5 py-1 font-mono text-xs font-semibold text-up">
            <TrendingUp className="h-3.5 w-3.5" aria-hidden />
            +0.54%
          </div>
        </div>

        {/* drawing sparkline */}
        <svg viewBox="0 0 340 90" className="mt-3 h-24 w-full" aria-hidden>
          <defs>
            <linearGradient id="hv-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.35" />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <motion.path
            d={`${HERO_LINE} L340,90 L0,90 Z`}
            fill="url(#hv-fill)"
            initial={reduce ? false : { opacity: 0 }}
            animate={reduce ? {} : { opacity: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
          />
          <motion.path
            d={HERO_LINE}
            fill="none"
            stroke="var(--primary)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={reduce ? false : { pathLength: 0 }}
            animate={reduce ? {} : { pathLength: 1 }}
            transition={{ duration: 1.4, ease: 'easeInOut', delay: 0.4 }}
          />
        </svg>

        {/* bias meter */}
        <div className="mt-3 rounded-xl border border-border bg-surface/60 p-3">
          <div className="flex items-center justify-between font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
            <span>Today’s bias</span>
            <span className="font-semibold text-up">▲ Bullish</span>
          </div>
          <div className="relative mt-2 h-1.5 rounded-full bg-[linear-gradient(90deg,var(--down),rgba(125,125,140,0.35)_50%,var(--up))]">
            <motion.span
              className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary bg-white shadow-[0_0_10px_var(--accent-glow)]"
              initial={reduce ? false : { left: '50%' }}
              animate={{ left: '70%' }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.6 }}
            />
          </div>
          <div className="mt-2 grid grid-cols-4 gap-1.5">
            {(['D1 ▲', 'H4 ▲', 'H1 —', 'M15 ▲'] as const).map((c, i) => (
              <div
                key={c}
                className={cn(
                  'rounded-md py-1 text-center font-mono text-[9px] font-semibold',
                  i === 2 ? 'bg-surface text-muted-foreground' : 'bg-up/12 text-up',
                )}
              >
                {c}
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* floating chips */}
      <motion.div
        className="absolute -top-4 -right-3 hidden rounded-xl border border-border bg-bg-elevated/90 px-3 py-2 shadow-card backdrop-blur-xl sm:block"
        animate={reduce ? {} : { y: [0, 8, 0] }}
        transition={{ duration: 5.5, ease: 'easeInOut', repeat: Infinity }}
      >
        <div className="font-mono text-[9px] tracking-widest text-muted-foreground uppercase">
          Profit factor
        </div>
        <div className="text-sm font-semibold text-up">2.36</div>
      </motion.div>
    </motion.div>
  )
}

/* ── page ────────────────────────────────────────────────────────────────── */

export default function Welcome() {
  const token = useAuth((s) => s.token)
  const primaryHref = token ? '/dashboard' : '/register'
  const primaryLabel = token ? 'Open dashboard' : 'Get started — free'

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
        <section className="relative mx-auto max-w-6xl px-5 pt-14 pb-20 sm:pt-20">
          {/* animated aurora glow */}
          <motion.div
            aria-hidden
            className="pointer-events-none absolute -top-24 left-1/2 -z-0 h-[420px] w-[760px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,var(--accent-glow),transparent_70%)] blur-2xl"
            initial={{ opacity: 0.45, scale: 0.95 }}
            animate={{ opacity: [0.4, 0.7, 0.4], scale: [0.95, 1.04, 0.95] }}
            transition={{ duration: 9, ease: 'easeInOut', repeat: Infinity }}
          />
          <div className="relative grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="animate-fade-up text-center lg:text-left">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3.5 py-1.5 font-mono text-[11px] tracking-[0.12em] text-foreground-subtle uppercase">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-up opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-up" />
                </span>
                Live market intelligence
              </div>
              <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-6xl">
                <span className="bg-gradient-to-b from-foreground to-foreground/55 bg-clip-text text-transparent">
                  Trade gold &amp; forex with a{' '}
                </span>
                <Shimmer>clearer edge</Shimmer>
                <span className="bg-gradient-to-b from-foreground to-foreground/55 bg-clip-text text-transparent">
                  .
                </span>
              </h1>
              <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground lg:mx-0">
                Forex Desk fuses live prices, a composite directional bias, multi-timeframe
                confluence and your own trade journal into one cinematic command center — so you
                spend less time gathering data and more time deciding.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
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
              <div className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 lg:justify-start">
                {[
                  [Check, 'No login to explore'],
                  [ShieldCheck, 'Your journal stays yours'],
                  [Sparkles, 'Open source'],
                ].map(([Icon, t], i) => (
                  <span
                    key={i}
                    className="flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground"
                  >
                    <Icon className="h-3.5 w-3.5 text-up" aria-hidden />
                    {t as string}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex justify-center lg:justify-end">
              <HeroVisual />
            </div>
          </div>
        </section>

        {/* live ticker strip */}
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

        {/* stats */}
        <section className="mx-auto max-w-5xl px-5 py-16" aria-label="By the numbers">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {STATS.map((s, i) => (
              <Reveal
                key={s.label}
                delay={i * 0.06}
                className="rounded-2xl border border-border bg-gradient-to-b from-surface to-surface/10 p-6 text-center shadow-card"
              >
                <div className="bg-gradient-to-b from-foreground to-foreground/60 bg-clip-text text-3xl font-semibold tracking-tight text-transparent tabular-nums sm:text-4xl">
                  {s.text ?? <Counter to={s.to ?? 0} suffix={s.suffix} />}
                </div>
                <div className="mt-2 font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
                  {s.label}
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* features */}
        <section className="mx-auto max-w-6xl px-5 py-16" aria-labelledby="features-title">
          <Reveal>
            <SectionLabel>The edge</SectionLabel>
            <SectionTitle id="features-title">
              Built for the decisions that move your P&amp;L
            </SectionTitle>
          </Reveal>
          <div className="mt-12 grid gap-4 sm:grid-cols-2">
            {FEATURES.map((f, i) => {
              const Icon = f.icon
              return (
                <Reveal
                  key={f.title}
                  delay={i * 0.05}
                  className="group flex gap-4 rounded-2xl border border-border bg-gradient-to-b from-surface to-surface/10 p-6 shadow-card backdrop-blur-sm transition-[transform,box-shadow,border-color] duration-300 ease-expo hover:-translate-y-1 hover:border-border-hover hover:shadow-card-hover"
                >
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-primary/20 bg-primary/10 shadow-inner-top">
                    <Icon className="h-5 w-5 text-primary" aria-hidden />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold tracking-tight">{f.title}</h3>
                    <p className="mt-1.5 text-base leading-relaxed text-muted-foreground sm:text-sm">
                      {f.desc}
                    </p>
                  </div>
                </Reveal>
              )
            })}
          </div>
        </section>

        {/* testimonials */}
        <section
          className="border-y border-border bg-bg-elevated/40 py-20"
          aria-labelledby="reviews-title"
        >
          <div className="mx-auto max-w-6xl px-5">
            <Reveal>
              <SectionLabel>Trader feedback</SectionLabel>
              <SectionTitle id="reviews-title">
                Loved by traders who take it <Shimmer>seriously</Shimmer>
              </SectionTitle>
              <div className="mt-5 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Stars n={5} />
                <span className="font-semibold text-foreground">4.8</span>
                <span>average from early users</span>
              </div>
            </Reveal>

            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {TESTIMONIALS.map((t, i) => (
                <Reveal
                  key={t.name}
                  delay={(i % 3) * 0.08}
                  className="flex flex-col rounded-2xl border border-border bg-gradient-to-b from-surface to-surface/10 p-6 shadow-card backdrop-blur-sm transition-[transform,box-shadow,border-color] duration-300 ease-expo hover:-translate-y-1 hover:border-border-hover hover:shadow-card-hover"
                >
                  <Quote className="h-6 w-6 text-primary/40" aria-hidden />
                  <p className="mt-3 flex-1 leading-relaxed text-foreground/90">{t.quote}</p>
                  <div className="mt-5 flex items-center gap-3 border-t border-border pt-4">
                    <span
                      className={cn(
                        'grid h-10 w-10 shrink-0 place-items-center rounded-full text-sm font-bold',
                        TINT[t.tint],
                      )}
                    >
                      {t.name[0]}
                    </span>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold">{t.name}</div>
                      <div className="truncate font-mono text-[11px] text-muted-foreground">
                        {t.role}
                      </div>
                    </div>
                    <div className="ml-auto">
                      <Stars n={t.stars} />
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* cta */}
        <section className="relative px-5 py-24" aria-labelledby="cta-title">
          <motion.div
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-1/2 -z-0 h-[460px] w-[760px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,var(--accent-glow),transparent_65%)] blur-2xl"
            initial={{ opacity: 0.4 }}
            animate={{ opacity: [0.35, 0.6, 0.35] }}
            transition={{ duration: 8, ease: 'easeInOut', repeat: Infinity }}
          />
          <Reveal className="relative mx-auto max-w-2xl rounded-3xl border border-border-hover bg-gradient-to-b from-surface to-surface/10 px-8 py-14 text-center shadow-card-hover backdrop-blur-xl">
            <h2
              id="cta-title"
              className="bg-gradient-to-b from-foreground to-foreground/55 bg-clip-text text-3xl font-semibold tracking-tight text-transparent sm:text-4xl"
            >
              Your next session starts with a <Shimmer>clear plan</Shimmer>
            </h2>
            <p className="mx-auto mt-4 max-w-md leading-relaxed text-muted-foreground">
              Build your widget grid, read the bias, journal every trade. Free, open source, and
              ready right now.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button asChild size="lg">
                <Link to={primaryHref}>
                  {primaryLabel}
                  <ArrowRight className="h-4 w-4" aria-hidden />
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
