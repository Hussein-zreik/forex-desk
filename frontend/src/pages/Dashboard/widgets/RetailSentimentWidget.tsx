import { EmptyState } from '@/components/ui/EmptyState'
import { AsyncWidget } from '@/components/widget/AsyncWidget'
import { useWidgetData } from '@/hooks/useWidgetData'
import { api } from '@/lib/api'
import { cn } from '@/lib/cn'
import { symbolLabel } from '@/lib/symbols'

interface RetailData {
  symbol: string
  longPct?: number
  shortPct?: number
  contrarian?: 'bullish' | 'bearish' | 'neutral'
  error?: string
}

interface Props {
  symbol?: string
  title?: string
  editMode?: boolean
  onRemove?: () => void
}

const HINT: Record<string, string> = {
  bullish: 'text-up',
  bearish: 'text-down',
  neutral: 'text-muted-foreground',
}

export function RetailSentimentWidget({ symbol = 'EURUSD=X', title, editMode, onRemove }: Props) {
  const query = useWidgetData<RetailData>(
    () => api(`/api/retail-sentiment?symbol=${encodeURIComponent(symbol)}`),
    [symbol],
    { pollMs: 900_000 },
  )

  return (
    <AsyncWidget
      title={title ?? `Retail — ${symbolLabel(symbol)}`}
      editMode={editMode}
      onRemove={onRemove}
      query={query}
      isEmpty={(d) => !!d.error || d.longPct == null}
      empty={<EmptyState compact title="Retail data unavailable" />}
    >
      {(d) => {
        const long = d.longPct ?? 50
        const short = d.shortPct ?? 100 - long
        return (
          <div className="flex h-full flex-col justify-center gap-3">
            <div className="flex h-3 w-full overflow-hidden rounded-full bg-surface">
              <div className="bg-up" style={{ width: `${long}%` }} />
              <div className="bg-down" style={{ width: `${short}%` }} />
            </div>
            <div className="flex justify-between text-sm tabular-nums">
              <span className="text-up">{long.toFixed(0)}% long</span>
              <span className="text-down">{short.toFixed(0)}% short</span>
            </div>
            {d.contrarian && (
              <div className="text-center text-xs">
                <span className="text-muted-foreground">Contrarian bias: </span>
                <span className={cn('font-medium capitalize', HINT[d.contrarian])}>
                  {d.contrarian}
                </span>
              </div>
            )}
          </div>
        )
      }}
    </AsyncWidget>
  )
}
