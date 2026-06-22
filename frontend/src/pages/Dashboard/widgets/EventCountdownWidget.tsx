import { useEffect, useState } from 'react'
import { WidgetFrame } from '@/components/widget/WidgetFrame'

// Upcoming high-impact events (static reference schedule, UTC).
const EVENTS = [
  { name: 'US NFP', date: '2026-07-03T12:30:00Z' },
  { name: 'US CPI', date: '2026-07-15T12:30:00Z' },
  { name: 'ECB Rate Decision', date: '2026-07-23T12:15:00Z' },
  { name: 'FOMC Rate Decision', date: '2026-07-29T18:00:00Z' },
]

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

interface Props {
  editMode?: boolean
  onRemove?: () => void
}

export function EventCountdownWidget({ editMode, onRemove }: Props) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const next = EVENTS.map((e) => ({ ...e, t: new Date(e.date).getTime() }))
    .filter((e) => e.t > now)
    .sort((a, b) => a.t - b.t)[0]

  return (
    <WidgetFrame title="Event Countdown" editMode={editMode} onRemove={onRemove}>
      {next ? (
        (() => {
          const diff = Math.max(0, next.t - now)
          const days = Math.floor(diff / 86_400_000)
          const hours = Math.floor((diff % 86_400_000) / 3_600_000)
          const mins = Math.floor((diff % 3_600_000) / 60_000)
          const secs = Math.floor((diff % 60_000) / 1000)
          return (
            <div className="flex h-full flex-col items-center justify-center gap-2">
              <div className="text-sm text-muted-foreground">{next.name}</div>
              <div className="font-mono text-2xl font-semibold tabular-nums">
                {pad(days)}:{pad(hours)}:{pad(mins)}:{pad(secs)}
              </div>
              <div className="text-[10px] tracking-widest text-muted-foreground uppercase">
                days · hrs · min · sec
              </div>
            </div>
          )
        })()
      ) : (
        <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
          No upcoming events
        </div>
      )}
    </WidgetFrame>
  )
}
