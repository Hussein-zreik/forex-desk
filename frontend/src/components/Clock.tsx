import { useEffect, useState } from 'react'

/** Auto-updating clock in the user's resolved (geo) timezone. */
export function Clock() {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
  const time = new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(now)

  return (
    <div className="hidden items-baseline gap-2 font-mono sm:flex" aria-label="Local time">
      <span className="text-sm tabular-nums text-foreground">{time}</span>
      <span className="hidden text-xs text-muted-foreground lg:inline">{tz}</span>
    </div>
  )
}
