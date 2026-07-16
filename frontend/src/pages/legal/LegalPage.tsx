import { ArrowLeft } from 'lucide-react'
import { type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Background } from '@/components/Background'
import { Footer } from '@/components/Footer'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'

export interface LegalSection {
  heading: string
  body: string[]
}

/** Shared shell for the static legal pages (public, no auth). */
export function LegalPage({
  title,
  updated,
  intro,
  sections,
  children,
}: {
  title: string
  updated: string
  intro?: string
  sections: LegalSection[]
  children?: ReactNode
}) {
  return (
    <div className="relative min-h-dvh">
      <Background />
      <main className="relative mx-auto max-w-3xl px-5 py-12">
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden /> Back to Forex Desk
        </Link>
        <Card className="p-8">
          <Badge>Legal</Badge>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-1 font-mono text-xs text-muted-foreground">Last updated: {updated}</p>
          {intro && <p className="mt-4 leading-relaxed text-muted-foreground">{intro}</p>}
          <div className="mt-6 space-y-6">
            {sections.map((s) => (
              <section key={s.heading}>
                <h2 className="text-lg font-semibold tracking-tight">{s.heading}</h2>
                {s.body.map((p, i) => (
                  <p key={i} className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {p}
                  </p>
                ))}
              </section>
            ))}
          </div>
          {children}
        </Card>
      </main>
      <Footer />
    </div>
  )
}
