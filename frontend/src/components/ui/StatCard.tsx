import { type ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { Card } from './Card'

export interface StatCardProps {
  label: ReactNode
  value: number | string
  /** Number formatting for numeric values. `money` prefixes a `$` and groups digits. */
  format?: 'number' | 'money'
  /** Color the value green/red by sign (positive/negative/zero). Ignored if `tone` is set. */
  colorByValue?: boolean
  /** Force a value color regardless of sign. */
  tone?: 'up' | 'down' | 'default'
  /** Visual density. `sm` suits dense grids (6-8 cards); `md` is the default. */
  size?: 'sm' | 'md'
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
  tone,
  size = 'md',
  hint,
  className,
}: StatCardProps) {
  const numeric = typeof value === 'number' ? value : null
  let color = 'text-foreground'
  if (tone === 'up') color = 'text-up'
  else if (tone === 'down') color = 'text-down'
  else if (colorByValue && numeric !== null) {
    color = numeric > 0 ? 'text-up' : numeric < 0 ? 'text-down' : 'text-foreground'
  }

  return (
    <Card className={cn(size === 'sm' ? 'p-3' : 'p-4', className)}>
      <div className={cn('text-muted-foreground', size === 'sm' ? 'text-[11px]' : 'text-xs')}>
        {label}
      </div>
      <div
        className={cn(
          'font-bold tabular-nums',
          size === 'sm' ? 'mt-0.5 text-xl' : 'mt-1 text-3xl',
          color,
        )}
      >
        {formatValue(value, format)}
      </div>
      {hint ? <div className="mt-0.5 text-xs text-muted-foreground">{hint}</div> : null}
    </Card>
  )
}
