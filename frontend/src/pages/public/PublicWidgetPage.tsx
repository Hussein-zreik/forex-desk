import { ArrowRight } from 'lucide-react'
import { type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Background } from '@/components/Background'
import { Footer } from '@/components/Footer'
import { Button } from '@/components/ui/Button'
import { useMeta } from '@/hooks/useMeta'
import routes from '@/lib/publicRoutes.json'

/**
 * Shell for the public SEO pages: crawlable copy + one live widget, reusing
 * the already-public API. Meta comes from publicRoutes.json — the same source
 * the prerender script bakes into the static HTML.
 */
export function PublicWidgetPage({
  path,
  heading,
  intro,
  children,
}: {
  path: string
  heading: string
  intro: string[]
  children: ReactNode
}) {
  const meta = routes.find((r) => r.path === path)
  useMeta(meta?.title ?? heading, meta?.description ?? intro[0] ?? '')

  return (
    <div className="relative min-h-dvh">
      <Background />
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-4xl items-center gap-3 px-4">
          <Link to="/" className="flex items-center gap-2" aria-label="Forex Desk home">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary text-primary-foreground shadow-cta">
              <span className="font-mono text-[11px] font-bold">FX</span>
            </span>
            <span className="text-sm font-semibold tracking-tight">Forex Desk</span>
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <Button asChild size="sm" variant="ghost">
              <Link to="/demo">Live demo</Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/register">Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-10">
        <h1 className="text-3xl font-semibold tracking-tight">{heading}</h1>
        {intro.map((p, i) => (
          <p key={i} className="mt-3 max-w-2xl leading-relaxed text-muted-foreground">
            {p}
          </p>
        ))}

        <div className="mt-8 h-[480px]">{children}</div>

        <p className="mt-8 text-sm text-muted-foreground">
          Want this on your own dashboard, next to live quotes, the composite bias and your
          journal?{' '}
          <Link
            to="/register"
            className="inline-flex items-center gap-1 font-medium text-primary hover:text-accent-bright"
          >
            Build your free desk <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </p>
      </main>
      <Footer />
    </div>
  )
}
