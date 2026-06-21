import { WidgetFrame } from '@/components/widget/WidgetFrame'
import { cn } from '@/lib/cn'
import { fmtPrice } from '@/lib/format'
import { useMarketData } from '@/store/useMarketData'

interface Props {
  symbol?: string
  title?: string
  editMode?: boolean
  onRemove?: () => void
}

function niceStep(price: number): number {
  const magnitude = Math.pow(10, Math.floor(Math.log10(Math.abs(price))))
  return magnitude / 20
}

function roundLevels(price: number, step: number, each: number): number[] {
  const base = Math.round(price / step) * step
  const out: number[] = []
  for (let i = each; i >= -each; i--) out.push(base + i * step)
  return out
}

export function RoundNumbersWidget({
  symbol = 'XAU=F',
  title = 'Round Numbers — Gold',
  editMode,
  onRemove,
}: Props) {
  const quote = useMarketData((s) => s.quotes[symbol])
  const price = quote?.price ?? null
  const step = price ? niceStep(price) : 0
  const levels = price ? roundLevels(price, step, 3) : []

  return (
    <WidgetFrame title={title} editMode={editMode} onRemove={onRemove}>
      {price != null ? (
        <ul className="flex h-full flex-col justify-center gap-1 text-sm">
          {levels.map((lv) => {
            const near = Math.abs(lv - price) < step / 2
            return (
              <li key={lv} className="flex items-center justify-between">
                <span className={cn('tabular-nums', near && 'font-semibold text-primary')}>
                  {fmtPrice(lv)}
                </span>
                <span className="text-[11px] tabular-nums text-muted-foreground">
                  {lv > price
                    ? `+${fmtPrice(lv - price)}`
                    : lv < price
                      ? `-${fmtPrice(price - lv)}`
                      : '•'}
                </span>
              </li>
            )
          })}
        </ul>
      ) : (
        <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
          Waiting for price…
        </div>
      )}
    </WidgetFrame>
  )
}
