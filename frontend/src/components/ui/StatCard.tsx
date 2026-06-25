import { type ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { Card } from './Card'

export interface StatCardProps {
  label: ReactNode
  value: number | string
  /** Number formatting for numeric values. `money` prefixes a `$` and groups digits. */
  format?: 'number' | 'money'
  /** Color the value green/red by sign (positive/negative/zero). */
  colorByValue?: boolean
  /** Optional secondary line under the value. */
  hint?: ReactNode
  className?: string
}

function formatValue(value: number | string, format: 'number' | 'money'): string {
  if (typeof value === 'string') return value
  if (format === 'money') {
    return `${value < 0 ? '-' : ''}$${Math.abs(value).toLocaleString()}`
  }
  return value.toLocaleString()
}

/** Compact metric card: label + prominent value, optionally sign-colored. */
export function StatCard({
  label,
  value,
  format = 'number',
  colorByValue,
  hint,
  className,
}: StatCardProps) {
  const numeric = typeof value === 'number' ? value : null
  const color =
    colorByValue && numeric !== null
      ? numeric > 0
        ? 'text-up'
        : numeric < 0
          ? 'text-down'
          : 'text-foreground'
      : 'text-foreground'

  return (
    <Card className={cn('p-4', className)}>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={cn('mt-1 text-2xl font-semibold tabular-nums', color)}>
        {formatValue(value, format)}
      </div>
      {hint ? <div className="mt-0.5 text-xs text-muted-foreground">{hint}</div> : null}
    </Card>
  )
}
