import { History, Mail, RotateCcw, Volume2, VolumeX, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { TelegramLink } from '@/components/TelegramLink'
import { AsyncBoundary } from '@/components/ui/AsyncBoundary'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { WidgetFrame } from '@/components/widget/WidgetFrame'
import { useWidgetData } from '@/hooks/useWidgetData'
import { api, ApiError } from '@/lib/api'
import { cn } from '@/lib/cn'
import { fmtPrice } from '@/lib/format'
import { playAlertSound } from '@/lib/sound'
import { SYMBOL_LABELS, symbolLabel } from '@/lib/symbols'
import { useMarketData } from '@/store/useMarketData'
import { useSettings } from '@/store/useSettings'
import { useWatchlist } from '@/store/useWatchlist'

interface Alert {
  id: string
  symbol: string
  condition: string
  level: number
  status: string
  triggered_price?: number | null
  seen?: boolean
  notify_email?: boolean
}

interface AlertHit {
  id: string
  symbol: string
  condition: string
  level: number
  price: number
  fired_at: string
}

interface Props {
  editMode?: boolean
  onRemove?: () => void
}

function fmtWhen(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

/** Read-only log of past alert fires. */
function AlertHistoryList() {
  const query = useWidgetData<AlertHit[]>(() => api('/api/alerts/history'), [], {
    pollMs: 60_000,
  })
  return (
    <AsyncBoundary
      data={query.data}
      loading={query.loading}
      error={query.error}
      onRetry={query.refresh}
      isEmpty={(d) => d.length === 0}
      empty={<EmptyState compact title="No alerts have fired yet" />}
      compact
    >
      {(hits) => (
        <ul className="space-y-1">
          {hits.map((h) => (
            <li
              key={h.id}
              className="flex items-center gap-2 rounded-lg bg-surface px-2 py-1.5 text-xs"
            >
              <span className="font-medium">{symbolLabel(h.symbol)}</span>
              <span className="text-muted-foreground">
                {h.condition} {h.level}
              </span>
              <span className="rounded bg-up/20 px-1 font-mono text-[10px] text-up">
                @ {fmtPrice(h.price)}
              </span>
              <span className="ml-auto font-mono text-[10px] text-muted-foreground">
                {fmtWhen(h.fired_at)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </AsyncBoundary>
  )
}

export function PriceAlertsWidget({ editMode, onRemove }: Props) {
  const query = useWidgetData<Alert[]>(() => api('/api/alerts'), [], {
    pollMs: 30_000,
  })
  const { data, refresh } = query
  const alerts = useMemo(() => data ?? [], [data])
  // Alertable symbols follow the user's watchlist (loaded by the ticker).
  const watchSymbols = useWatchlist((s) => s.symbols)
  const [picked, setPicked] = useState('XAU=F')
  // Keep the selection valid as the watchlist changes, without a sync effect.
  const symbol = watchSymbols.includes(picked) ? picked : (watchSymbols[0] ?? 'XAU=F')
  const setSymbol = setPicked
  const [condition, setCondition] = useState('ABOVE')
  const [level, setLevel] = useState('')
  const [notifyEmail, setNotifyEmail] = useState(false)
  const [tab, setTab] = useState<'active' | 'history'>('active')

  const soundEnabled = useSettings((s) => s.soundEnabled)
  const soundPattern = useSettings((s) => s.soundPattern)
  const toggleSound = useSettings((s) => s.toggleSound)

  // Server push: refresh the list the moment any alert fires.
  const alertPing = useMarketData((s) => s.alertPing)
  const lastPing = useRef(alertPing)
  useEffect(() => {
    if (alertPing !== lastPing.current) {
      lastPing.current = alertPing
      void refresh()
    }
  }, [alertPing, refresh])

  // Chime when an alert flips ACTIVE -> HIT between refreshes (seed silently).
  const prevStatus = useRef<Record<string, string>>({})
  useEffect(() => {
    const prev = prevStatus.current
    const seeded = Object.keys(prev).length > 0
    if (seeded && soundEnabled) {
      for (const a of alerts) {
        if (prev[a.id] === 'ACTIVE' && a.status === 'HIT') playAlertSound(soundPattern)
      }
    }
    prevStatus.current = Object.fromEntries(alerts.map((a) => [a.id, a.status]))
  }, [alerts, soundEnabled, soundPattern])

  const [gateMsg, setGateMsg] = useState<string | null>(null)

  async function add(e: FormEvent) {
    e.preventDefault()
    const lv = parseFloat(level)
    if (!lv) return
    setGateMsg(null)
    try {
      await api<Alert>('/api/alerts', {
        method: 'POST',
        body: JSON.stringify({ symbol, condition, level: lv, notify_email: notifyEmail }),
      })
      setLevel('')
      await refresh()
    } catch (err) {
      // Plan gate (403) or transient failure — show it where the user acted.
      setGateMsg(err instanceof ApiError ? err.message : 'Could not create the alert.')
    }
  }

  async function remove(id: string) {
    await api(`/api/alerts/${id}`, { method: 'DELETE' })
    await refresh()
  }

  async function rearm(id: string) {
    await api(`/api/alerts/${id}`, { method: 'PATCH', body: JSON.stringify({ status: 'ACTIVE' }) })
    await refresh()
  }

  async function markSeen(a: Alert) {
    if (a.status !== 'HIT' || a.seen) return
    await api(`/api/alerts/${a.id}`, { method: 'PATCH', body: JSON.stringify({ seen: true }) })
    await refresh()
  }

  const compactSelect = 'no-drag h-8 text-xs'

  return (
    <WidgetFrame
      title="Price Alerts"
      editMode={editMode}
      onRemove={onRemove}
      onRefresh={refresh}
      loading={query.loading}
    >
      <div className="flex h-full flex-col gap-2">
        <TelegramLink />
        <div className="flex items-center gap-1 text-xs">
          {(['active', 'history'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cn(
                'no-drag rounded-md px-2 py-1 font-medium capitalize transition-colors',
                tab === t
                  ? 'bg-primary/15 text-primary'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {t === 'history' ? (
                <span className="flex items-center gap-1">
                  <History className="h-3 w-3" /> History
                </span>
              ) : (
                'Active'
              )}
            </button>
          ))}
        </div>

        {tab === 'history' ? (
          <div className="min-h-0 flex-1 overflow-auto">
            <AlertHistoryList />
          </div>
        ) : (
          <>
        <form onSubmit={add} className="flex flex-wrap items-center gap-1">
          <Select
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            wrapperClassName="w-auto"
            className={compactSelect}
            aria-label="Alert symbol"
          >
            {watchSymbols.map((s) => (
              <option key={s} value={s}>
                {SYMBOL_LABELS[s] ?? s}
              </option>
            ))}
          </Select>
          <Select
            value={condition}
            onChange={(e) => setCondition(e.target.value)}
            wrapperClassName="w-auto"
            className={compactSelect}
            aria-label="Alert condition"
          >
            <option value="ABOVE">Above</option>
            <option value="BELOW">Below</option>
          </Select>
          <Input
            type="number"
            inputMode="decimal"
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            placeholder="Level"
            aria-label="Alert level"
            className="no-drag h-8 w-20 text-sm"
          />
          <button
            type="button"
            onClick={() => setNotifyEmail((v) => !v)}
            aria-pressed={notifyEmail}
            aria-label="Also notify by email"
            title={notifyEmail ? 'Email notification on' : 'Email notification off'}
            className={cn(
              'no-drag rounded p-1.5',
              notifyEmail ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Mail className="h-3.5 w-3.5" />
          </button>
          <Button size="sm" type="submit">
            Add
          </Button>
          <button
            type="button"
            onClick={toggleSound}
            className="no-drag ml-auto rounded p-1.5 text-muted-foreground hover:text-foreground"
            aria-label={soundEnabled ? 'Mute alert sound' : 'Unmute alert sound'}
            title={soundEnabled ? 'Alert sound on' : 'Alert sound off'}
          >
            {soundEnabled ? (
              <Volume2 className="h-3.5 w-3.5" />
            ) : (
              <VolumeX className="h-3.5 w-3.5" />
            )}
          </button>
        </form>

        {gateMsg && (
          <p role="alert" className="text-[11px] leading-relaxed text-warning">
            {gateMsg}{' '}
            <Link to="/pricing" className="no-drag font-medium text-primary hover:text-accent-bright">
              See plans
            </Link>
          </p>
        )}

        <div className="min-h-0 flex-1 overflow-auto">
          <AsyncBoundary
            data={query.data}
            loading={query.loading}
            error={query.error}
            onRetry={refresh}
            isEmpty={(d) => d.length === 0}
            empty={<EmptyState compact title="No alerts yet" />}
            compact
          >
            {() => (
              <ul className="space-y-1">
                {alerts.map((a) => (
                  <li
                    key={a.id}
                    onClick={() => void markSeen(a)}
                    className={cn(
                      'flex items-center gap-2 rounded-lg bg-surface px-2 py-1.5 text-xs',
                      a.status === 'HIT' && !a.seen && 'ring-1 ring-up/40',
                    )}
                  >
                    {a.status === 'HIT' && !a.seen && (
                      <span
                        className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-up"
                        aria-label="Unseen alert"
                      />
                    )}
                    <span className="font-medium">{symbolLabel(a.symbol)}</span>
                    <span className="text-muted-foreground">
                      {a.condition} {a.level}
                    </span>
                    {a.notify_email && (
                      <Mail className="h-3 w-3 text-muted-foreground" aria-label="Email on" />
                    )}
                    <span
                      className={cn(
                        'rounded px-1 font-mono text-[10px]',
                        a.status === 'HIT'
                          ? 'bg-up/20 text-up'
                          : 'bg-surface text-muted-foreground',
                      )}
                    >
                      {a.status === 'HIT' && a.triggered_price != null
                        ? `HIT @ ${fmtPrice(a.triggered_price)}`
                        : a.status}
                    </span>
                    <span className="ml-auto flex items-center gap-1">
                      {a.status === 'HIT' && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            void rearm(a.id)
                          }}
                          className="no-drag text-muted-foreground hover:text-primary"
                          aria-label="Re-arm alert"
                          title="Re-arm"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          void remove(a.id)
                        }}
                        className="no-drag text-muted-foreground hover:text-destructive"
                        aria-label="Delete alert"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </AsyncBoundary>
        </div>
          </>
        )}
      </div>
    </WidgetFrame>
  )
}
