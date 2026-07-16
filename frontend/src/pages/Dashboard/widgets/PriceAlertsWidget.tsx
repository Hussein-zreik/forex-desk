import { Mail, RotateCcw, Send, Volume2, VolumeX, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { AsyncBoundary } from '@/components/ui/AsyncBoundary'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { WidgetFrame } from '@/components/widget/WidgetFrame'
import { useWidgetData } from '@/hooks/useWidgetData'
import { api } from '@/lib/api'
import { cn } from '@/lib/cn'
import { fmtPrice } from '@/lib/format'
import { playAlertChime } from '@/lib/sound'
import { SYMBOL_LABELS, symbolLabel } from '@/lib/symbols'
import { useMarketData } from '@/store/useMarketData'
import { useSettings } from '@/store/useSettings'

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

interface TelegramStatus {
  configured: boolean
  linked: boolean
}

const SYMBOLS = ['XAU=F', 'EURUSD=X', 'GBPUSD=X', 'USDJPY=X', 'DX-Y.NYB', 'BTC-USD']

interface Props {
  editMode?: boolean
  onRemove?: () => void
}

/** Compact Telegram link/unlink row (hidden while the server has no bot). */
function TelegramLink() {
  const [status, setStatus] = useState<TelegramStatus | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    api<TelegramStatus>('/api/telegram/status')
      .then(setStatus)
      .catch(() => {})
  }, [])

  if (!status?.configured) return null

  async function link() {
    setBusy(true)
    try {
      const { link } = await api<{ link: string }>('/api/telegram/link', { method: 'POST' })
      window.open(link, '_blank', 'noopener')
      // Optimistic: the user completes /start in Telegram; refresh shortly after.
      setTimeout(() => {
        api<TelegramStatus>('/api/telegram/status').then(setStatus).catch(() => {})
      }, 8000)
    } finally {
      setBusy(false)
    }
  }

  async function unlink() {
    await api('/api/telegram/link', { method: 'DELETE' })
    setStatus({ configured: true, linked: false })
  }

  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-surface px-2 py-1.5 text-[11px]">
      <Send className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
      {status.linked ? (
        <>
          <span className="text-muted-foreground">Telegram linked — alerts DM you.</span>
          <button
            type="button"
            onClick={unlink}
            className="no-drag ml-auto cursor-pointer text-muted-foreground hover:text-destructive"
          >
            Unlink
          </button>
        </>
      ) : (
        <>
          <span className="text-muted-foreground">Get alerts in Telegram.</span>
          <button
            type="button"
            onClick={link}
            disabled={busy}
            className="no-drag ml-auto cursor-pointer font-medium text-primary hover:text-accent-bright disabled:opacity-50"
          >
            Link now
          </button>
        </>
      )}
    </div>
  )
}

export function PriceAlertsWidget({ editMode, onRemove }: Props) {
  const query = useWidgetData<Alert[]>(() => api('/api/alerts'), [], {
    pollMs: 30_000,
  })
  const { data, refresh } = query
  const alerts = useMemo(() => data ?? [], [data])
  const [symbol, setSymbol] = useState('XAU=F')
  const [condition, setCondition] = useState('ABOVE')
  const [level, setLevel] = useState('')
  const [notifyEmail, setNotifyEmail] = useState(false)

  const soundEnabled = useSettings((s) => s.soundEnabled)
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
        if (prev[a.id] === 'ACTIVE' && a.status === 'HIT') playAlertChime()
      }
    }
    prevStatus.current = Object.fromEntries(alerts.map((a) => [a.id, a.status]))
  }, [alerts, soundEnabled])

  async function add(e: FormEvent) {
    e.preventDefault()
    const lv = parseFloat(level)
    if (!lv) return
    await api<Alert>('/api/alerts', {
      method: 'POST',
      body: JSON.stringify({ symbol, condition, level: lv, notify_email: notifyEmail }),
    })
    setLevel('')
    await refresh()
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
        <form onSubmit={add} className="flex flex-wrap items-center gap-1">
          <Select
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            wrapperClassName="w-auto"
            className={compactSelect}
            aria-label="Alert symbol"
          >
            {SYMBOLS.map((s) => (
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
      </div>
    </WidgetFrame>
  )
}
