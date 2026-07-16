import { Link } from 'react-router-dom'
import { EmptyState } from '@/components/ui/EmptyState'
import { AsyncWidget } from '@/components/widget/AsyncWidget'
import { Sparkline } from '@/components/widget/Sparkline'
import { StatRow } from '@/components/widget/StatRow'
import { useWidgetData } from '@/hooks/useWidgetData'
import { api } from '@/lib/api'
import { cn } from '@/lib/cn'

interface Horizon {
  correct: number
  wrong: number
  n: number
  hit_rate: number | null
}

interface TrackRecord {
  stats: {
    symbol: string
    snapshots: number
    h1d: Horizon
    h1w: Horizon
  }
  history: {
    points: { bucket: string; score: number }[]
  }
}

/** Below this many graded calls, a percentage is noise — show progress instead. */
const MIN_SAMPLE = 20

interface Props {
  symbol?: string
  editMode?: boolean
  onRemove?: () => void
}

function HitRate({ label, h }: { label: string; h: Horizon }) {
  if (h.n < MIN_SAMPLE) {
    return (
      <StatRow
        label={label}
        value={
          <span className="text-muted-foreground">
            collecting data — {h.n}/{MIN_SAMPLE}
          </span>
        }
      />
    )
  }
  const good = (h.hit_rate ?? 0) >= 50
  return (
    <StatRow
      label={label}
      value={
        <span className={cn('font-mono font-semibold', good ? 'text-up' : 'text-down')}>
          {h.hit_rate}%{' '}
          <span className="font-normal text-muted-foreground">(n={h.n})</span>
        </span>
      }
    />
  )
}

export function BiasTrackRecordWidget({ symbol = 'XAU=F', editMode, onRemove }: Props) {
  const query = useWidgetData<TrackRecord>(
    async () => {
      const [stats, history] = await Promise.all([
        api<TrackRecord['stats']>(`/api/bias/stats?symbol=${encodeURIComponent(symbol)}`),
        api<TrackRecord['history']>(
          `/api/bias/history?symbol=${encodeURIComponent(symbol)}&days=30`,
        ),
      ])
      return { stats, history }
    },
    [symbol],
    { pollMs: 600_000 },
  )

  return (
    <AsyncWidget
      title="Bias Track Record"
      editMode={editMode}
      onRemove={onRemove}
      query={query}
      isEmpty={(d) => d.stats.snapshots === 0}
      empty={
        <EmptyState
          compact
          title="No snapshots yet"
          description="The bias is recorded hourly — the track record builds itself from here."
        />
      }
    >
      {(d) => (
        <div className="flex h-full flex-col gap-2">
          {d.history.points.length >= 2 && (
            <div>
              <div className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                Composite score — 30 days
              </div>
              <Sparkline values={d.history.points.map((p) => p.score)} className="h-10 w-full" />
            </div>
          )}
          <div className="space-y-1 border-t border-border pt-2">
            <HitRate label="1-day hit rate" h={d.stats.h1d} />
            <HitRate label="1-week hit rate" h={d.stats.h1w} />
            <StatRow label="Snapshots recorded" value={d.stats.snapshots} />
          </div>
          <p className="mt-auto pt-1 text-center text-[10px] leading-relaxed text-muted-foreground">
            Indicative model signal — not investment advice.{' '}
            <Link to="/disclaimer" className="no-drag underline hover:text-primary">
              Details
            </Link>
          </p>
        </div>
      )}
    </AsyncWidget>
  )
}
