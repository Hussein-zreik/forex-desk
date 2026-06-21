export interface SessionDef {
  name: string
  start: number // UTC hour
  end: number // UTC hour (may wrap past midnight)
}

export const SESSIONS: SessionDef[] = [
  { name: 'Sydney', start: 22, end: 7 },
  { name: 'Tokyo', start: 0, end: 9 },
  { name: 'London', start: 8, end: 17 },
  { name: 'New York', start: 13, end: 22 },
]

export interface SessionStatus {
  name: string
  open: boolean
  msToChange: number
  label: string
}

function inSession(hour: number, start: number, end: number): boolean {
  if (start <= end) return hour >= start && hour < end
  return hour >= start || hour < end // wraps midnight
}

function nextBoundary(now: Date, hourUTC: number): Date {
  const d = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), hourUTC, 0, 0, 0),
  )
  if (d.getTime() <= now.getTime()) d.setUTCDate(d.getUTCDate() + 1)
  return d
}

function formatDelta(ms: number): string {
  const totalMin = Math.max(0, Math.floor(ms / 60000))
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  return `${h}h ${m}m`
}

export function sessionStatuses(now: Date): SessionStatus[] {
  const hour = now.getUTCHours()
  return SESSIONS.map((s) => {
    const open = inSession(hour, s.start, s.end)
    const boundary = open ? nextBoundary(now, s.end) : nextBoundary(now, s.start)
    const ms = boundary.getTime() - now.getTime()
    return {
      name: s.name,
      open,
      msToChange: ms,
      label: open ? `closes in ${formatDelta(ms)}` : `opens in ${formatDelta(ms)}`,
    }
  })
}
