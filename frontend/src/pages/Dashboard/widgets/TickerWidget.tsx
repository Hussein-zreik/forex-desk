import { Check, ListPlus } from 'lucide-react'
import { useEffect, useMemo, useRef } from 'react'
import { useMenu } from '@/hooks/useMenu'
import { api } from '@/lib/api'
import { cn } from '@/lib/cn'
import { symbolLabel } from '@/lib/symbols'
import { PriceSocket } from '@/services/websocket'
import { useMarketData, type Quote } from '@/store/useMarketData'
import { useWatchlist } from '@/store/useWatchlist'

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
      <span className="font-mono tabular-nums text-muted-foreground">
        {quote.price != null ? formatPrice(quote.price) : '—'}
      </span>
      {pct != null && (
        <span className={cn('font-mono tabular-nums', up ? 'text-up' : 'text-down')}>
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

/** Popover for picking watchlist symbols from the server catalog. */
function WatchlistEditor() {
  const { open, toggle: toggleOpen, rootRef, triggerRef, surfaceProps } = useMenu({ mode: 'menu' })
  const symbols = useWatchlist((s) => s.symbols)
  const catalog = useWatchlist((s) => s.catalog)
  const save = useWatchlist((s) => s.save)

  if (catalog.length === 0) return null // logged out / not loaded yet

  function toggle(symbol: string) {
    const has = symbols.includes(symbol)
    if (has && symbols.length === 1) return // never save an empty watchlist
    void save(has ? symbols.filter((s) => s !== symbol) : [...symbols, symbol])
  }

  return (
    <div ref={rootRef} className="relative flex items-center">
      <button
        ref={triggerRef}
        type="button"
        onClick={toggleOpen}
        aria-expanded={open}
        aria-label="Edit watchlist"
        title="Edit watchlist"
        className={cn(
          'mx-1 grid h-7 w-7 cursor-pointer place-items-center rounded-md transition-colors duration-200',
          open
            ? 'bg-primary/15 text-primary'
            : 'text-muted-foreground hover:bg-surface hover:text-foreground',
        )}
      >
        <ListPlus className="h-3.5 w-3.5" />
      </button>
      {open && (
        <div
          {...surfaceProps}
          aria-label="Edit watchlist"
          className="absolute top-9 right-0 z-50 max-h-80 w-56 overflow-y-auto rounded-xl border border-border bg-background/95 p-2 shadow-xl backdrop-blur-xl"
        >
          <p className="px-2 pt-1 pb-2 text-[11px] text-muted-foreground">
            Your watchlist ({symbols.length})
          </p>
          {catalog.map(({ symbol, label }) => {
            const active = symbols.includes(symbol)
            return (
              <button
                key={symbol}
                type="button"
                role="menuitem"
                tabIndex={-1}
                aria-checked={active}
                onClick={() => toggle(symbol)}
                className={cn(
                  'flex w-full cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-xs',
                  active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
                  'hover:bg-surface',
                )}
              >
                <span
                  className={cn(
                    'grid h-4 w-4 place-items-center rounded border',
                    active ? 'border-primary bg-primary text-primary-foreground' : 'border-border',
                  )}
                >
                  {active && <Check className="h-3 w-3" />}
                </span>
                <span className="font-medium">{label}</span>
                <span className="ml-auto font-mono text-[10px] text-muted-foreground">
                  {symbol}
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function TickerWidget() {
  const quotes = useMarketData((s) => s.quotes)
  const upsertQuotes = useMarketData((s) => s.upsertQuotes)
  const socketRef = useRef<PriceSocket | null>(null)
  const symbols = useWatchlist((s) => s.symbols)
  const loadWatchlist = useWatchlist((s) => s.load)

  useEffect(() => {
    void loadWatchlist()
    const socket = new PriceSocket()
    socketRef.current = socket
    const unsubscribe = socket.subscribe((data) => {
      const msg = data as { type?: string; quotes?: Quote[] }
      if (msg.type === 'quotes' && msg.quotes) upsertQuotes(msg.quotes)
      if (msg.type === 'alert_hit') useMarketData.getState().pingAlerts()
    })
    socket.connect()

    return () => {
      unsubscribe()
      socket.close()
    }
  }, [upsertQuotes, loadWatchlist])

  // REST covers what the WS stream doesn't: fetch the watchlist's quotes on
  // mount and refresh each minute so off-stream symbols stay current.
  useEffect(() => {
    let cancelled = false
    function fetchQuotes() {
      api<{ quotes: Quote[] }>(`/api/quotes?symbols=${symbols.join(',')}`)
        .then((res) => {
          if (!cancelled) upsertQuotes(res.quotes)
        })
        .catch(() => {})
    }
    fetchQuotes()
    const id = setInterval(fetchQuotes, 60_000)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [symbols, upsertQuotes])

  const ordered = useMemo(
    () => symbols.map((s) => quotes[s]).filter(Boolean) as Quote[],
    [quotes, symbols],
  )

  return (
    // `relative z-30` lifts the bar's stacking context (created by backdrop-blur)
    // above the page content, so the watchlist popover isn't covered by the sidebar.
    <div className="relative z-30 flex items-center border-b border-border bg-background/60 backdrop-blur-sm">
      <div className="min-w-0 flex-1">
        <TickerStrip quotes={ordered} />
      </div>
      <WatchlistEditor />
    </div>
  )
}
