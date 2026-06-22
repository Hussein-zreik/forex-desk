import { Volume2, VolumeX, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { WidgetFrame } from '@/components/widget/WidgetFrame'
import { useWidgetData } from '@/hooks/useWidgetData'
import { api } from '@/lib/api'
import { cn } from '@/lib/cn'
import { playAlertChime } from '@/lib/sound'
import { SYMBOL_LABELS, symbolLabel } from '@/lib/symbols'
import { useSettings } from '@/store/useSettings'

interface Alert {
  id: string
  symbol: string
  condition: string
  level: number
  status: string
}

const SYMBOLS = ['XAU=F', 'EURUSD=X', 'GBPUSD=X', 'USDJPY=X', 'DX-Y.NYB', 'BTC-USD']

interface Props {
  editMode?: boolean
  onRemove?: () => void
}

export function PriceAlertsWidget({ editMode, onRemove }: Props) {
  const { data, loading, error, refresh } = useWidgetData<Alert[]>(() => api('/api/alerts'), [], {
    pollMs: 30_000,
  })
  const alerts = useMemo(() => data ?? [], [data])
  const [symbol, setSymbol] = useState('XAU=F')
  const [condition, setCondition] = useState('ABOVE')
  const [level, setLevel] = useState('')

  const soundEnabled = useSettings((s) => s.soundEnabled)
  const toggleSound = useSettings((s) => s.toggleSound)

  // Chime when an alert flips ACTIVE -> HIT between polls (seed silently on first load).
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
      body: JSON.stringify({ symbol, condition, level: lv }),
    })
    setLevel('')
    await refresh()
  }

  async function remove(id: string) {
    await api(`/api/alerts/${id}`, { method: 'DELETE' })
    await refresh()
  }

  const selectCls =
    'no-drag h-8 rounded-lg border border-input bg-bg-elevated px-2 text-xs text-foreground'

  return (
    <WidgetFrame
      title="Price Alerts"
      editMode={editMode}
      onRemove={onRemove}
      onRefresh={refresh}
      loading={loading}
      error={error}
    >
      <div className="flex h-full flex-col gap-2">
        <form onSubmit={add} className="flex flex-wrap items-center gap-1">
          <select value={symbol} onChange={(e) => setSymbol(e.target.value)} className={selectCls}>
            {SYMBOLS.map((s) => (
              <option key={s} value={s}>
                {SYMBOL_LABELS[s] ?? s}
              </option>
            ))}
          </select>
          <select
            value={condition}
            onChange={(e) => setCondition(e.target.value)}
            className={selectCls}
          >
            <option value="ABOVE">Above</option>
            <option value="BELOW">Below</option>
          </select>
          <Input
            type="number"
            inputMode="decimal"
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            placeholder="Level"
            className="no-drag h-8 w-20 text-sm"
          />
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

        <ul className="flex-1 space-y-1 overflow-auto">
          {alerts.length === 0 ? (
            <li className="py-4 text-center text-xs text-muted-foreground">No alerts yet</li>
          ) : (
            alerts.map((a) => (
              <li
                key={a.id}
                className="flex items-center gap-2 rounded-lg bg-surface px-2 py-1.5 text-xs"
              >
                <span className="font-medium">{symbolLabel(a.symbol)}</span>
                <span className="text-muted-foreground">
                  {a.condition} {a.level}
                </span>
                <span
                  className={cn(
                    'rounded px-1 text-[10px]',
                    a.status === 'HIT' ? 'bg-up/20 text-up' : 'bg-surface text-muted-foreground',
                  )}
                >
                  {a.status}
                </span>
                <button
                  type="button"
                  onClick={() => remove(a.id)}
                  className="no-drag ml-auto text-muted-foreground hover:text-destructive"
                  aria-label="Delete alert"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    </WidgetFrame>
  )
}
