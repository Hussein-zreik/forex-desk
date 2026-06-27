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
  const signal = quoteSignal(quote?.changePercent)
  const hasDetail =
    quote &&
    (quote.dayHigh != null || quote.dayLow != null || quote.bid != null || quote.ask != null)

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
        <div className="flex h-full flex-col gap-3">
          <div>
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

          {hasDetail && (
            <dl className="space-y-1 border-t border-border pt-2 text-xs">
              {quote.dayHigh != null && <Row label="High" value={fmtPrice(quote.dayHigh)} />}
              {quote.dayLow != null && <Row label="Low" value={fmtPrice(quote.dayLow)} />}
              {(quote.bid != null || quote.ask != null) && (
                <Row label="Bid/Ask" value={`${fmtPrice(quote.bid)} / ${fmtPrice(quote.ask)}`} />
              )}
            </dl>
          )}

          {signal && (
            <div
              className={cn(
                'mt-auto rounded-lg border py-2 text-center text-xs font-semibold tracking-wide',
                signal.cls,
              )}
            >
              {signal.label}
            </div>
          )}
        </div>
      )}
    </WidgetFrame>
  )
}

/** A directional read derived from the day's % change. */
function quoteSignal(cp: number | null | undefined) {
  if (cp == null) return null
  if (cp > 0.1) return { label: 'BUY SIGNAL', cls: 'border-up/30 bg-up/10 text-up' }
  if (cp < -0.1) return { label: 'SELL SIGNAL', cls: 'border-down/30 bg-down/10 text-down' }
  return { label: 'FLAT SIGNAL', cls: 'border-warning/30 bg-warning/10 text-warning' }
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium tabular-nums">{value}</dd>
    </div>
  )
}
