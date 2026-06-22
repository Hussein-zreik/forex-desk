import { WidgetFrame } from '@/components/widget/WidgetFrame'
import { cn } from '@/lib/cn'

// Central-bank benchmark rates (%), manually maintained reference (static).
const RATES: { ccy: string; rate: number }[] = [
  { ccy: 'USD', rate: 5.5 },
  { ccy: 'GBP', rate: 5.25 },
  { ccy: 'NZD', rate: 5.5 },
  { ccy: 'AUD', rate: 4.35 },
  { ccy: 'CAD', rate: 4.75 },
  { ccy: 'EUR', rate: 4.25 },
  { ccy: 'CHF', rate: 1.5 },
  { ccy: 'JPY', rate: 0.1 },
]

interface Props {
  editMode?: boolean
  onRemove?: () => void
}

export function RateDifferentialWidget({ editMode, onRemove }: Props) {
  const max = Math.max(...RATES.map((r) => r.rate))

  return (
    <WidgetFrame title="Rate Differential" editMode={editMode} onRemove={onRemove}>
      <ul className="flex h-full flex-col justify-center gap-1.5">
        {RATES.map((r) => (
          <li key={r.ccy} className="flex items-center gap-2">
            <span className="w-9 text-xs font-medium">{r.ccy}</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface">
              <div
                className={cn('h-full rounded-full bg-primary')}
                style={{ width: `${(r.rate / max) * 100}%` }}
              />
            </div>
            <span className="w-12 text-right text-[11px] tabular-nums text-muted-foreground">
              {r.rate.toFixed(2)}%
            </span>
          </li>
        ))}
      </ul>
    </WidgetFrame>
  )
}
