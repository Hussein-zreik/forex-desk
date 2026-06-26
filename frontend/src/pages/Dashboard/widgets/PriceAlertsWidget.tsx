import { Volume2, VolumeX, X } from 'lucide-react'
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
  const query = useWidgetData<Alert[]>(() => api('/api/alerts'), [], {
    pollMs: 30_000,
  })
  const { data, refresh } = query
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
                    className="flex items-center gap-2 rounded-lg bg-surface px-2 py-1.5 text-xs"
                  >
                    <span className="font-medium">{symbolLabel(a.symbol)}</span>
                    <span className="text-muted-foreground">
                      {a.condition} {a.level}
                    </span>
                    <span
                      className={cn(
                        'rounded px-1 text-[10px]',
                        a.status === 'HIT'
                          ? 'bg-up/20 text-up'
                          : 'bg-surface text-muted-foreground',
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
                ))}
              </ul>
            )}
          </AsyncBoundary>
        </div>
      </div>
    </WidgetFrame>
  )
}
