import { useEffect, useState } from 'react'
import { useSettings } from '@/store/useSettings'

/** Auto-updating clock; shows local (geo) time or UTC per the user's setting. */
export function Clock() {
  const [now, setNow] = useState(() => new Date())
  const clockDisplay = useSettings((s) => s.clockDisplay)

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const utc = clockDisplay === 'utc'
  const tz = utc ? 'UTC' : Intl.DateTimeFormat().resolvedOptions().timeZone
  const time = new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    ...(utc ? { timeZone: 'UTC' } : {}),
  }).format(now)

  return (
    <div
      className="hidden items-baseline gap-2 font-mono sm:flex"
      aria-label={utc ? 'UTC time' : 'Local time'}
    >
      <span className="text-sm tabular-nums text-foreground">{time}</span>
      <span className="hidden text-xs text-muted-foreground lg:inline">{tz}</span>
    </div>
  )
}
