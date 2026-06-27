import { EmptyState } from '@/components/ui/EmptyState'
import { AsyncWidget } from '@/components/widget/AsyncWidget'
import { Gauge } from '@/components/widget/Gauge'
import { Sparkline } from '@/components/widget/Sparkline'
import { useWidgetData } from '@/hooks/useWidgetData'
import { api } from '@/lib/api'

interface FngPoint {
  value: number
  timestamp: number
  classification: string | null
}
interface FngData {
  latest: FngPoint | null
  history: FngPoint[]
  error?: string
}

function fngColor(value: number): string {
  if (value < 25) return '#f4626f' // coral (down)
  if (value < 45) return '#f5a623' // warning amber
  if (value < 55) return '#eab308' // yellow
  if (value < 75) return '#a3e635' // lime
  return '#4ade80' // success green
}

/** Nearest history point to `days` ago (by timestamp; handles s or ms epochs). */
function ago(history: FngPoint[], latestTs: number, days: number): number | null {
  if (history.length < 3) return null
  const unit = latestTs > 1e12 ? 86_400_000 : 86_400
  const target = latestTs - days * unit
  let best: FngPoint | null = null
  let bestD = Infinity
  for (const h of history) {
    const d = Math.abs(h.timestamp - target)
    if (d < bestD) {
      bestD = d
      best = h
    }
  }
  // Reject if the nearest point is more than ~40% off the requested span.
  return best && bestD <= days * unit * 0.4 ? best.value : null
}

function Stat({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="rounded-lg border border-border bg-surface px-2 py-1.5 text-center">
      <div className="text-[10px] tracking-wide text-muted-foreground uppercase">{label}</div>
      <div className="text-sm font-semibold tabular-nums">{value ?? '—'}</div>
    </div>
  )
}

interface Props {
  editMode?: boolean
  onRemove?: () => void
}

export function FearGreedWidget({ editMode, onRemove }: Props) {
  const query = useWidgetData<FngData>(() => api<FngData>('/api/fear-greed'), [], {
    pollMs: 600_000,
  })

  return (
    <AsyncWidget
      title="Fear & Greed"
      editMode={editMode}
      onRemove={onRemove}
      query={query}
      isEmpty={(d) => !!d.error || !d.latest}
      empty={<EmptyState compact title="Sentiment data unavailable" />}
    >
      {(data) => {
        const latest = data.latest!
        const color = fngColor(latest.value)
        const y = ago(data.history, latest.timestamp, 1)
        const w = ago(data.history, latest.timestamp, 7)
        const m = ago(data.history, latest.timestamp, 30)
        const showStats = y != null || w != null || m != null
        return (
          <div className="flex h-full flex-col justify-center gap-2">
            <div className="flex flex-col items-center">
              <Gauge
                value={latest.value}
                min={0}
                max={100}
                color={color}
                centerLabel={String(latest.value)}
                centerSub={latest.classification ?? ''}
              />
              {data.history.length > 1 && (
                <Sparkline
                  values={data.history.map((h) => h.value)}
                  color={color}
                  className="mt-1 h-7 w-full"
                />
              )}
            </div>
            {showStats && (
              <div className="grid grid-cols-3 gap-2">
                <Stat label="Yesterday" value={y} />
                <Stat label="1 Week" value={w} />
                <Stat label="1 Month" value={m} />
              </div>
            )}
            <p className="text-center text-[10px] leading-snug text-muted-foreground">
              0 = extreme fear · 100 = extreme greed.
            </p>
          </div>
        )
      }}
    </AsyncWidget>
  )
}
