import { Lightbulb, Newspaper } from 'lucide-react'
import { useState } from 'react'
import { AsyncBoundary } from '@/components/ui/AsyncBoundary'
import { Card } from '@/components/ui/Card'
import { SkeletonText } from '@/components/ui/Skeleton'
import { useWidgetData } from '@/hooks/useWidgetData'
import { api } from '@/lib/api'
import { cn } from '@/lib/cn'
import type { NewsData } from '@/pages/Dashboard/widgets/NewsWidget'

const DOT: Record<string, string> = {
  positive: 'bg-up',
  negative: 'bg-down',
  neutral: 'bg-muted-foreground/50',
}

/** Rotating desk tips shown when no live headlines are available, so the
 *  right-hand panel stays useful instead of leaving a large empty area. */
const TIPS = [
  'Plan the trade, trade the plan — define your stop before you enter.',
  'Risk a fixed % per trade; consistency beats any single win.',
  'When the timeframes disagree, the highest-probability move is to wait.',
  'Journal every trade — the patterns that cost you hide in the notes.',
  'News moves price fast; size down around high-impact releases.',
]

function NewsFallback() {
  // Pick a tip once on mount (kept stable across re-renders).
  const [tip] = useState(() => TIPS[Math.floor(Date.now() / 3_600_000) % TIPS.length])
  return (
    <div className="flex flex-col gap-3 py-1">
      <div className="flex flex-col items-center gap-1.5 text-center">
        <Newspaper className="h-6 w-6 text-muted-foreground/60" aria-hidden />
        <p className="text-xs font-medium text-foreground">No news available at this time.</p>
        <p className="text-[11px] text-muted-foreground">Here&rsquo;s a desk tip meanwhile:</p>
      </div>
      <div className="flex items-start gap-2 rounded-lg border border-border bg-surface p-3">
        <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
        <p className="text-[11px] leading-relaxed text-muted-foreground">{tip}</p>
      </div>
    </div>
  )
}

export function Sidebar() {
  const query = useWidgetData<NewsData>(() => api('/api/news?feed=fx'), [], { pollMs: 600_000 })

  return (
    <aside className="hidden w-72 shrink-0 lg:block">
      <Card className="sticky top-20">
        <div className="flex items-center gap-2 border-b border-border pb-3">
          <Newspaper className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold tracking-tight">Market News</h2>
        </div>
        {/* Scrolls independently of the page: bounded to the viewport (below the
            sticky offset + card chrome) with overscroll contained so the wheel
            doesn't fall through to the page while browsing headlines. */}
        <div className="mt-3 max-h-[calc(100dvh-13rem)] overflow-y-auto overscroll-contain">
          <AsyncBoundary
            compact
            data={query.data}
            loading={query.loading}
            error={query.error}
            onRetry={query.refresh}
            isEmpty={(d) => !!d.error || d.articles.length === 0}
            skeleton={
              <div className="space-y-4">
                {[0, 1, 2, 3].map((i) => (
                  <SkeletonText key={i} lines={2} />
                ))}
              </div>
            }
            empty={<NewsFallback />}
          >
            {(d) => (
              <ul className="flex flex-col gap-1">
                {d.articles.map((a, i) => (
                  <li key={i}>
                    <a
                      href={a.link}
                      target="_blank"
                      rel="noreferrer"
                      className="block rounded-lg p-1.5 hover:bg-surface"
                    >
                      <div className="flex items-start gap-2">
                        <span
                          className={cn('mt-1 h-1.5 w-1.5 shrink-0 rounded-full', DOT[a.sentiment])}
                        />
                        <span className="text-xs leading-snug">{a.title}</span>
                      </div>
                      {a.source && (
                        <div className="mt-0.5 ml-3.5 text-[10px] text-muted-foreground">
                          {a.source}
                        </div>
                      )}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </AsyncBoundary>
        </div>
      </Card>
    </aside>
  )
}
