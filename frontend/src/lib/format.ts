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
