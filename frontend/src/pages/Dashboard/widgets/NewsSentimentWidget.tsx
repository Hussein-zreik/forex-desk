import { Newspaper } from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'
import { AsyncWidget } from '@/components/widget/AsyncWidget'
import { useWidgetData } from '@/hooks/useWidgetData'
import { api } from '@/lib/api'
import { cn } from '@/lib/cn'
import { type NewsData } from './NewsWidget'

interface Props {
  editMode?: boolean
  onRemove?: () => void
}

export function NewsSentimentWidget({ editMode, onRemove }: Props) {
  const query = useWidgetData<NewsData>(() => api('/api/news'), [], {
    pollMs: 600_000,
  })

  return (
    <AsyncWidget
      title="News Sentiment"
      editMode={editMode}
      onRemove={onRemove}
      query={query}
      isEmpty={(d) => !!d.error}
      empty={
        <EmptyState compact icon={Newspaper} title="No news available at this time." />
      }
    >
      {(data) => {
        const s = data.sentiment ?? { positive: 0, negative: 0, neutral: 0 }
        const total = s.positive + s.negative + s.neutral || 1
        const net = s.positive - s.negative
        const label = net > 0 ? 'Bullish' : net < 0 ? 'Bearish' : 'Neutral'
        const color = net > 0 ? 'text-up' : net < 0 ? 'text-down' : 'text-muted-foreground'
        return (
          <div className="flex h-full flex-col items-center justify-center gap-3">
            <div className={cn('text-2xl font-bold', color)}>{label}</div>
            <div className="flex h-2 w-full overflow-hidden rounded-full bg-surface">
              <div className="bg-up" style={{ width: `${(s.positive / total) * 100}%` }} />
              <div
                className="bg-muted-foreground/40"
                style={{ width: `${(s.neutral / total) * 100}%` }}
              />
              <div className="bg-down" style={{ width: `${(s.negative / total) * 100}%` }} />
            </div>
            <div className="flex gap-3 text-[11px]">
              <span className="text-up">▲ {s.positive}</span>
              <span className="text-muted-foreground">● {s.neutral}</span>
              <span className="text-down">▼ {s.negative}</span>
            </div>
          </div>
        )
      }}
    </AsyncWidget>
  )
}
