import { useState } from 'react'
import { EmptyState } from '@/components/ui/EmptyState'
import { WidgetFrame } from '@/components/widget/WidgetFrame'
import { api, ApiError } from '@/lib/api'
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
  const [error, setError] = useState<string | null>(null)

  async function refresh() {
    setLoading(true)
    setError(null)
    try {
      const res = await api<{ quotes: Quote[] }>(
        `/api/quotes?symbols=${encodeURIComponent(symbol)}`,
      )
      upsertQuotes(res.quotes)
    } catch (e) {
      // Keep the last value if we have one; only surface the error when there's nothing to show.
      setError(e instanceof ApiError ? e.message : 'Price unavailable')
    } finally {
      setLoading(false)
    }
  }

  const hasQuote = quote && quote.price != null
  const up = (quote?.changePercent ?? 0) >= 0

  return (
    <WidgetFrame
      title={title}
      editMode={editMode}
      onRemove={onRemove}
      onRefresh={refresh}
      loading={loading}
      error={!hasQuote ? error : null}
    >
      {!hasQuote ? (
        <EmptyState compact title="Waiting for price…" />
      ) : (
        <div className="flex h-full flex-col justify-center">
          <div className="text-2xl font-semibold tabular-nums">{fmtPrice(quote.price)}</div>
          <div
            className={cn(
              'mt-1 flex items-center gap-2 text-sm tabular-nums',
              up ? 'text-up' : 'text-down',
            )}
          >
            <span>{fmtSigned(quote.change, Math.abs(quote.price!) < 10 ? 4 : 2)}</span>
            {quote.changePercent != null && <span>({fmtSigned(quote.changePercent)}%)</span>}
          </div>
        </div>
      )}
    </WidgetFrame>
  )
}
