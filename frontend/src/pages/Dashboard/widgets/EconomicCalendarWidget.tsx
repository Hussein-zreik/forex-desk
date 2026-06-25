import { useEffect, useState } from 'react'
import { EmptyState } from '@/components/ui/EmptyState'
import { AsyncWidget } from '@/components/widget/AsyncWidget'
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

function upcomingEvents(d: CalData, now: number): CalEvent[] {
  return (d.events ?? [])
    .filter((e) => e.date && new Date(e.date).getTime() > now)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 8)
}

interface Props {
  editMode?: boolean
  onRemove?: () => void
}

export function EconomicCalendarWidget({ editMode, onRemove }: Props) {
  const query = useWidgetData<CalData>(() => api('/api/calendar'), [], {
    pollMs: 600_000,
  })
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000)
    return () => clearInterval(id)
  }, [])

  return (
    <AsyncWidget
      title="Economic Calendar"
      editMode={editMode}
      onRemove={onRemove}
      query={query}
      isEmpty={(d) => !!d.error || upcomingEvents(d, now).length === 0}
      empty={
        <EmptyState
          compact
          title={query.data?.error ? 'Calendar unavailable' : 'No upcoming events'}
        />
      }
    >
      {(d) => (
        <ul className="flex h-full flex-col gap-1.5 overflow-auto text-sm">
          {upcomingEvents(d, now).map((e, i) => (
            <li key={i} className="flex items-center gap-2">
              <span
                className={cn('h-2 w-2 shrink-0 rounded-full', IMPACT_DOT[e.impact] ?? IMPACT_DOT.low)}
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
      )}
    </AsyncWidget>
  )
}
