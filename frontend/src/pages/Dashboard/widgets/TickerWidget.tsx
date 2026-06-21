import { useEffect, useMemo, useRef } from 'react'
import { api } from '@/lib/api'
import { cn } from '@/lib/cn'
import { symbolLabel, TICKER_SYMBOLS } from '@/lib/symbols'
import { PriceSocket } from '@/services/websocket'
import { useMarketData, type Quote } from '@/store/useMarketData'

function formatPrice(value: number): string {
  const digits = Math.abs(value) < 10 ? 4 : 2
  return value.toLocaleString(undefined, { maximumFractionDigits: digits })
}

function TickerItem({ quote }: { quote: Quote }) {
  const pct = quote.changePercent
  const up = (pct ?? 0) >= 0
  return (
    <span className="inline-flex items-center gap-2 text-xs">
      <span className="font-medium text-foreground">{symbolLabel(quote.symbol)}</span>
      <span className="tabular-nums text-muted-foreground">
        {quote.price != null ? formatPrice(quote.price) : '—'}
      </span>
      {pct != null && (
        <span className={cn('tabular-nums', up ? 'text-up' : 'text-down')}>
          {up ? '▲' : '▼'} {Math.abs(pct).toFixed(2)}%
        </span>
      )}
    </span>
  )
}

/** Presentational scrolling strip (pure — easy to test). */
export function TickerStrip({ quotes }: { quotes: Quote[] }) {
  if (quotes.length === 0) {
    return (
      <div className="flex h-9 items-center px-4 text-xs text-muted-foreground">
        Connecting to live market data…
      </div>
    )
  }
  const loop = [...quotes, ...quotes]
  return (
    <div className="group relative flex h-9 overflow-hidden">
      <div className="flex animate-ticker items-center gap-6 whitespace-nowrap pl-4 group-hover:[animation-play-state:paused]">
        {loop.map((q, i) => (
          <TickerItem key={`${q.symbol}-${i}`} quote={q} />
        ))}
      </div>
    </div>
  )
}

export function TickerWidget() {
  const quotes = useMarketData((s) => s.quotes)
  const upsertQuotes = useMarketData((s) => s.upsertQuotes)
  const socketRef = useRef<PriceSocket | null>(null)

  useEffect(() => {
    api<{ quotes: Quote[] }>(`/api/quotes?symbols=${TICKER_SYMBOLS.join(',')}`)
      .then((res) => upsertQuotes(res.quotes))
      .catch(() => {})

    const socket = new PriceSocket()
    socketRef.current = socket
    const unsubscribe = socket.subscribe((data) => {
      const msg = data as { type?: string; quotes?: Quote[] }
      if (msg.type === 'quotes' && msg.quotes) upsertQuotes(msg.quotes)
    })
    socket.connect()

    return () => {
      unsubscribe()
      socket.close()
    }
  }, [upsertQuotes])

  const ordered = useMemo(
    () => TICKER_SYMBOLS.map((s) => quotes[s]).filter(Boolean) as Quote[],
    [quotes],
  )

  return (
    <div className="border-b border-border bg-background/60 backdrop-blur-sm">
      <TickerStrip quotes={ordered} />
    </div>
  )
}
