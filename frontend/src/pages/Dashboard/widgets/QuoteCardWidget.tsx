import { useState } from 'react'
import { WidgetFrame } from '@/components/widget/WidgetFrame'
import { api } from '@/lib/api'
import { cn } from '@/lib/cn'
import { fmtPrice, fmtSigned } from '@/lib/format'
import { useMarketData, type Quote } from '@/store/useMarketData'

interface Props {
  symbol: string
  title: string
  editMode?: boolean
  onRemove?: () => void
}

export function QuoteCardWidget({ symbol, title, editMode, onRemove }: Props) {
  const quote = useMarketData((s) => s.quotes[symbol])
  const upsertQuotes = useMarketData((s) => s.upsertQuotes)
  const [loading, setLoading] = useState(false)

  async function refresh() {
    setLoading(true)
    try {
      const res = await api<{ quotes: Quote[] }>(
        `/api/quotes?symbols=${encodeURIComponent(symbol)}`,
      )
      upsertQuotes(res.quotes)
    } catch {
      // keep last value
    } finally {
      setLoading(false)
    }
  }

  const up = (quote?.changePercent ?? 0) >= 0

  return (
    <WidgetFrame
      title={title}
      editMode={editMode}
      onRemove={onRemove}
      onRefresh={refresh}
      loading={loading}
    >
      {!quote || quote.price == null ? (
        <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
          Waiting for price…
        </div>
      ) : (
        <div className="flex h-full flex-col justify-center">
          <div className="text-2xl font-semibold tabular-nums">{fmtPrice(quote.price)}</div>
          <div
            className={cn(
              'mt-1 flex items-center gap-2 text-sm tabular-nums',
              up ? 'text-up' : 'text-down',
            )}
          >
            <span>{fmtSigned(quote.change, Math.abs(quote.price) < 10 ? 4 : 2)}</span>
            {quote.changePercent != null && <span>({fmtSigned(quote.changePercent)}%)</span>}
          </div>
        </div>
      )}
    </WidgetFrame>
  )
}
