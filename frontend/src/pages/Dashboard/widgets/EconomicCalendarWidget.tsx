import { useEffect, useState } from 'react'
import { WidgetFrame } from '@/components/widget/WidgetFrame'
import { WidgetLoading } from '@/components/widget/WidgetLoading'
import { useWidgetData } from '@/hooks/useWidgetData'
import { api } from '@/lib/api'
import { cn } from '@/lib/cn'

interface CalEvent {
  title: string
  currency: string
  date: string
  impact: string
  forecast: string
  previous: string
}
interface CalData {
  events: CalEvent[]
  error?: string
}

const IMPACT_DOT: Record<string, string> = {
  high: 'bg-down',
  medium: 'bg-[#f59e0b]',
  low: 'bg-muted-foreground/60',
  holiday: 'bg-muted-foreground/30',
}

function timeLabel(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, {
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

interface Props {
  editMode?: boolean
  onRemove?: () => void
}

export function EconomicCalendarWidget({ editMode, onRemove }: Props) {
  const { data, loading, error, refresh } = useWidgetData<CalData>(() => api('/api/calendar'), [], {
    pollMs: 600_000,
  })
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000)
    return () => clearInterval(id)
  }, [])

  const upcoming = (data?.events ?? [])
    .filter((e) => e.date && new Date(e.date).getTime() > now)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 8)

  return (
    <WidgetFrame
      title="Economic Calendar"
      editMode={editMode}
      onRemove={onRemove}
      onRefresh={refresh}
      loading={loading}
      error={data?.error ? 'Calendar unavailable' : error}
    >
      {upcoming.length > 0 ? (
        <ul className="flex h-full flex-col gap-1.5 overflow-auto text-sm">
          {upcoming.map((e, i) => (
            <li key={i} className="flex items-center gap-2">
              <span
                className={cn(
                  'h-2 w-2 shrink-0 rounded-full',
                  IMPACT_DOT[e.impact] ?? IMPACT_DOT.low,
                )}
              />
              <span className="w-24 shrink-0 text-[11px] tabular-nums text-muted-foreground">
                {timeLabel(e.date)}
              </span>
              <span className="w-9 shrink-0 font-mono text-[11px] tracking-wider text-muted-foreground uppercase">
                {e.currency}
              </span>
              <span className="min-w-0 flex-1 truncate text-xs">{e.title}</span>
            </li>
          ))}
        </ul>
      ) : loading ? (
        <WidgetLoading />
      ) : (
        <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
          No upcoming events
        </div>
      )}
    </WidgetFrame>
  )
}
