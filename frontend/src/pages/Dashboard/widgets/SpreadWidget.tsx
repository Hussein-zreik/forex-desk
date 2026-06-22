import { WidgetFrame } from '@/components/widget/WidgetFrame'
import { cn } from '@/lib/cn'

// Typical retail spreads (pips), reference values.
const SPREADS = [
  { pair: 'EUR/USD', pips: 0.6 },
  { pair: 'GBP/USD', pips: 0.9 },
  { pair: 'USD/JPY', pips: 0.7 },
  { pair: 'AUD/USD', pips: 0.8 },
  { pair: 'USD/CAD', pips: 1.2 },
  { pair: 'XAU/USD', pips: 18 },
]

interface Props {
  editMode?: boolean
  onRemove?: () => void
}

export function SpreadWidget({ editMode, onRemove }: Props) {
  return (
    <WidgetFrame title="Spread Monitor" editMode={editMode} onRemove={onRemove}>
      <div className="flex h-full flex-col justify-center">
        <ul className="flex flex-col gap-1.5 text-sm">
          {SPREADS.map((s) => (
            <li key={s.pair} className="flex items-center justify-between">
              <span>{s.pair}</span>
              <span className={cn('tabular-nums', s.pips > 5 ? 'text-down' : 'text-foreground')}>
                {s.pips} pips
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-center text-[10px] text-muted-foreground">Typical spreads</p>
      </div>
    </WidgetFrame>
  )
}
