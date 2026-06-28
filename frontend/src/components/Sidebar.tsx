import { Newspaper } from 'lucide-react'
import { AsyncBoundary } from '@/components/ui/AsyncBoundary'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
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

export function Sidebar() {
  const query = useWidgetData<NewsData>(() => api('/api/news?feed=fx'), [], { pollMs: 600_000 })

  return (
    <aside className="hidden w-72 shrink-0 lg:block">
      <Card className="sticky top-20">
        <div className="flex items-center gap-2">
          <Newspaper className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold tracking-tight">Market News</h2>
        </div>
        <div className="mt-3">
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
            empty={
              <EmptyState compact title={query.data?.error ? 'News unavailable' : 'No headlines'} />
            }
          >
            {(d) => (
              <ul className="flex flex-col gap-1">
                {d.articles.slice(0, 8).map((a, i) => (
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
