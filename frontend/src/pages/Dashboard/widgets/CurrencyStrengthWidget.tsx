import { EmptyState } from '@/components/ui/EmptyState'
import { AsyncWidget } from '@/components/widget/AsyncWidget'
import { useWidgetData } from '@/hooks/useWidgetData'
import { api } from '@/lib/api'
import { cn } from '@/lib/cn'
import { type Quote } from '@/store/useMarketData'

const PAIRS = ['EURUSD=X', 'GBPUSD=X', 'USDJPY=X', 'USDCHF=X', 'AUDUSD=X', 'USDCAD=X', 'NZDUSD=X']

interface Strength {
  ccy: string
  value: number
}

function computeStrength(quotes: Quote[]): Strength[] {
  const acc: Record<string, { sum: number; n: number }> = {}
  const add = (ccy: string, v: number) => {
    acc[ccy] ??= { sum: 0, n: 0 }
    acc[ccy].sum += v
    acc[ccy].n += 1
  }
  for (const q of quotes) {
    if (q.changePercent == null) continue
    const s = q.symbol.replace('=X', '')
    add(s.slice(0, 3), q.changePercent)
    add(s.slice(3, 6), -q.changePercent)
  }
  return Object.entries(acc)
    .map(([ccy, v]) => ({ ccy, value: v.sum / v.n }))
    .sort((a, b) => b.value - a.value)
}

interface Props {
  editMode?: boolean
  onRemove?: () => void
}

export function CurrencyStrengthWidget({ editMode, onRemove }: Props) {
  const query = useWidgetData<{ quotes: Quote[] }>(
    () => api(`/api/quotes?symbols=${PAIRS.join(',')}`),
    [],
    { pollMs: 60_000 },
  )

  return (
    <AsyncWidget
      title="Currency Strength"
      editMode={editMode}
      onRemove={onRemove}
      query={query}
      isEmpty={(d) => computeStrength(d.quotes).length === 0}
      empty={<EmptyState compact title="Waiting for prices…" />}
    >
      {(d) => {
        const strength = computeStrength(d.quotes)
        return (
          <ul className="flex h-full flex-col justify-center gap-1.5">
            {strength.map((s) => (
              <li key={s.ccy} className="flex items-center gap-2">
                <span className="w-9 text-xs font-medium">{s.ccy}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface">
                  <div
                    className={cn('h-full rounded-full', s.value >= 0 ? 'bg-up' : 'bg-down')}
                    style={{ width: `${Math.min(100, Math.abs(s.value) * 25)}%` }}
                  />
                </div>
                <span
                  className={cn(
                    'w-12 text-right text-[11px] tabular-nums',
                    s.value >= 0 ? 'text-up' : 'text-down',
                  )}
                >
                  {s.value >= 0 ? '+' : ''}
                  {s.value.toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
        )
      }}
    </AsyncWidget>
  )
}
