import { WidgetFrame } from '@/components/widget/WidgetFrame'
import { cn } from '@/lib/cn'
import { CB_AS_OF, CENTRAL_BANKS, type RateBias } from '@/lib/centralBanks'

interface Props {
  editMode?: boolean
  onRemove?: () => void
}

const BIAS: Record<RateBias, { label: string; cls: string }> = {
  hike: { label: '▲ hike', cls: 'text-up' },
  cut: { label: '▼ cut', cls: 'text-down' },
  hold: { label: '— hold', cls: 'text-muted-foreground' },
}

export function CBRatesWidget({ editMode, onRemove }: Props) {
  return (
    <WidgetFrame title="Central Bank Rates" editMode={editMode} onRemove={onRemove}>
      <div className="flex h-full flex-col">
        <ul className="flex-1 space-y-0.5 text-sm">
          {CENTRAL_BANKS.map((b) => {
            const bias = BIAS[b.lastMove]
            return (
              <li key={b.ccy} className="flex items-center gap-2 py-0.5">
                <span className="w-9 font-mono text-xs text-muted-foreground">{b.ccy}</span>
                <span className="w-12 text-right font-semibold tabular-nums">
                  {b.rate.toFixed(2)}%
                </span>
                <span className={cn('w-16 text-[11px]', bias.cls)}>{bias.label}</span>
                <span className="ml-auto text-[10px] tabular-nums text-muted-foreground">
                  next {b.nextMeeting}
                </span>
              </li>
            )
          })}
        </ul>
        <div className="mt-1 border-t border-border pt-1 text-center text-[10px] text-muted-foreground">
          Policy rates · indicative, as of {CB_AS_OF}
        </div>
      </div>
    </WidgetFrame>
  )
}
