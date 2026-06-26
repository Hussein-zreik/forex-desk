export function fmtPrice(value: number | null | undefined): string {
  if (value == null) return '—'
  const digits = Math.abs(value) < 10 ? 4 : 2
  return value.toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}

export function fmtSigned(value: number | null | undefined, digits = 2): string {
  if (value == null) return '—'
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value.toFixed(digits)}`
}

/** Compact "time ago" for data-freshness labels: "now", "5s", "3m", "2h", "1d". */
export function fmtAgo(ts: number | null | undefined, now: number = Date.now()): string {
  if (ts == null) return ''
  const sec = Math.max(0, Math.round((now - ts) / 1000))
  if (sec < 5) return 'now'
  if (sec < 60) return `${sec}s`
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}m`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h`
  return `${Math.floor(hr / 24)}d`
}
