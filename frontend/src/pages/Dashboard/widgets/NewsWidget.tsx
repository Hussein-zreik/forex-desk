import { WidgetFrame } from '@/components/widget/WidgetFrame'
import { WidgetLoading } from '@/components/widget/WidgetLoading'
import { useWidgetData } from '@/hooks/useWidgetData'
import { api } from '@/lib/api'
import { cn } from '@/lib/cn'

export interface Article {
  title: string
  link: string
  pubDate?: string
  source?: string
  sentiment: 'positive' | 'negative' | 'neutral'
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
  editMode?: boolean
  onRemove?: () => void
}

export function NewsWidget({ editMode, onRemove }: Props) {
  const { data, loading, error, refresh } = useWidgetData<NewsData>(() => api('/api/news'), [], {
    pollMs: 600_000,
  })
  const articles = data?.articles ?? []

  return (
    <WidgetFrame
      title="Gold News"
      editMode={editMode}
      onRemove={onRemove}
      onRefresh={refresh}
      loading={loading}
      error={data?.error ? 'News unavailable' : error}
    >
      {articles.length > 0 ? (
        <ul className="flex h-full flex-col gap-1 overflow-auto">
          {articles.map((a, i) => (
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
                {a.source && (
                  <span className="ml-3.5 text-[10px] text-muted-foreground">{a.source}</span>
                )}
              </a>
            </li>
          ))}
        </ul>
      ) : loading ? (
        <WidgetLoading />
      ) : null}
    </WidgetFrame>
  )
}
