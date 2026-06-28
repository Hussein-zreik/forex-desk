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
  const signal = quoteSignal(quote)
  const hasDetail =
    quote &&
    (quote.dayHigh != null ||
      quote.dayLow != null ||
      quote.bid != null ||
      quote.ask != null ||
      quote.open != null)
  const spread =
    quote?.bid != null && quote?.ask != null ? Math.abs(quote.ask - quote.bid) : null

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
              {quote.open != null && <Row label="Open" value={fmtPrice(quote.open)} />}
              {quote.dayHigh != null && <Row label="High" value={fmtPrice(quote.dayHigh)} />}
              {quote.dayLow != null && <Row label="Low" value={fmtPrice(quote.dayLow)} />}
              {(quote.bid != null || quote.ask != null) && (
                <Row label="Bid/Ask" value={`${fmtPrice(quote.bid)} / ${fmtPrice(quote.ask)}`} />
              )}
              {spread != null && <Row label="Spread" value={fmtPrice(spread)} />}
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

const BUY = { label: 'BUY SIGNAL', cls: 'border-up/30 bg-up/10 text-up' }
const SELL = { label: 'SELL SIGNAL', cls: 'border-down/30 bg-down/10 text-down' }
const FLAT = { label: 'FLAT SIGNAL', cls: 'border-warning/30 bg-warning/10 text-warning' }

/**
 * Directional read: prefer the price's position within the day's range
 * (near the high = bullish, near the low = bearish), falling back to the day's
 * % change when the range isn't available.
 */
function quoteSignal(q?: Quote) {
  if (!q || q.price == null) return null
  if (q.dayHigh != null && q.dayLow != null && q.dayHigh > q.dayLow) {
    const pos = (q.price - q.dayLow) / (q.dayHigh - q.dayLow)
    return pos >= 0.66 ? BUY : pos <= 0.34 ? SELL : FLAT
  }
  if (q.changePercent == null) return null
  return q.changePercent > 0.1 ? BUY : q.changePercent < -0.1 ? SELL : FLAT
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium tabular-nums">{value}</dd>
    </div>
  )
}
