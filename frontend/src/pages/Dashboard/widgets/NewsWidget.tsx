import { Newspaper } from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'
import { AsyncWidget } from '@/components/widget/AsyncWidget'
import { useWidgetData } from '@/hooks/useWidgetData'
import { api } from '@/lib/api'
import { cn } from '@/lib/cn'

export interface Article {
  title: string
  link: string
  pubDate?: string
  source?: string
  sentiment: 'positive' | 'negative' | 'neutral'
  tags?: string[]
}

export interface NewsData {
  articles: Article[]
  sentiment: Record<string, number>
  error?: string
}

const DOT: Record<string, string> = {
  positive: 'bg-up',
  negative: 'bg-down',
  neutral: 'bg-muted-foreground/50',
}

interface Props {
  feed?: 'gold' | 'fx'
  title?: string
  editMode?: boolean
  onRemove?: () => void
}

export function NewsWidget({ feed = 'gold', title, editMode, onRemove }: Props) {
  const query = useWidgetData<NewsData>(() => api(`/api/news?feed=${feed}`), [feed], {
    pollMs: 600_000,
  })

  return (
    <AsyncWidget
      title={title ?? (feed === 'fx' ? 'FX News' : 'Gold News')}
      editMode={editMode}
      onRemove={onRemove}
      query={query}
      isEmpty={(d) => !!d.error || d.articles.length === 0}
      empty={
        <EmptyState
          compact
          icon={Newspaper}
          title="No news available at this time."
          description="Headlines will appear here as soon as the feeds update."
        />
      }
    >
      {(d) => (
        <ul className="flex h-full flex-col gap-1 overflow-auto">
          {d.articles.map((a, i) => (
            <li key={i}>
              <a
                href={a.link}
                target="_blank"
                rel="noreferrer"
                className="no-drag block rounded-lg p-1.5 hover:bg-surface"
              >
                <div className="flex items-start gap-2">
                  <span
                    className={cn('mt-1 h-1.5 w-1.5 shrink-0 rounded-full', DOT[a.sentiment])}
                  />
                  <span className="text-xs leading-snug">{a.title}</span>
                </div>
                <div className="ml-3.5 mt-0.5 flex flex-wrap items-center gap-1">
                  {a.source && (
                    <span className="text-[10px] text-muted-foreground">{a.source}</span>
                  )}
                  {a.tags?.map((t) => (
                    <span
                      key={t}
                      className="rounded bg-surface px-1 font-mono text-[9px] tracking-wide text-muted-foreground"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </a>
            </li>
          ))}
        </ul>
      )}
    </AsyncWidget>
  )
}
