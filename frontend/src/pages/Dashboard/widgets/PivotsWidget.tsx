import { EmptyState } from '@/components/ui/EmptyState'
import { AsyncWidget } from '@/components/widget/AsyncWidget'
import { useWidgetData } from '@/hooks/useWidgetData'
import { api } from '@/lib/api'
import { cn } from '@/lib/cn'
import { fmtPrice } from '@/lib/format'

interface PivotsData {
  symbol: string
  price?: number
  levels?: Record<string, number>
  error?: string
}

const ROWS = ['r3', 'r2', 'r1', 'pp', 's1', 's2', 's3'] as const

interface Props {
  symbol?: string
  title?: string
  editMode?: boolean
  onRemove?: () => void
}

export function PivotsWidget({
  symbol = 'XAU=F',
  title = 'Pivot Points — Gold',
  editMode,
  onRemove,
}: Props) {
  const query = useWidgetData<PivotsData>(
    () => api(`/api/indicators/pivots?symbol=${encodeURIComponent(symbol)}`),
    [symbol],
    { pollMs: 300_000 },
  )

  return (
    <AsyncWidget
      title={title}
      editMode={editMode}
      onRemove={onRemove}
      query={query}
      isEmpty={(d) => !!d.error || !d.levels}
      empty={<EmptyState compact title="Levels unavailable" />}
    >
      {(data) => {
        const levels = data.levels!
        const price = data.price
        // Nearest level to current price, for highlighting.
        const nearest =
          price != null
            ? ROWS.reduce((best, k) =>
                Math.abs(levels[k] - price) < Math.abs(levels[best] - price) ? k : best,
              )
            : null
        return (
          <ul className="flex h-full flex-col justify-center gap-0.5 text-sm">
            {ROWS.map((k) => {
              const isPivot = k === 'pp'
              const isResistance = k.startsWith('r')
              const delta = price != null ? levels[k] - price : null
              return (
                <li
                  key={k}
                  className={cn(
                    'flex items-center justify-between rounded px-1.5 py-0.5',
                    k === nearest && 'bg-surface',
                  )}
                >
                  <span
                    className={cn(
                      'font-mono text-xs uppercase',
                      isPivot ? 'text-primary' : isResistance ? 'text-up' : 'text-down',
                    )}
                  >
                    {k}
                  </span>
                  <span className="flex items-baseline gap-2">
                    {delta != null && (
                      <span className="text-[10px] tabular-nums text-muted-foreground">
                        {delta >= 0 ? '+' : ''}
                        {fmtPrice(delta)}
                      </span>
                    )}
                    <span className="tabular-nums">{fmtPrice(levels[k])}</span>
                  </span>
                </li>
              )
            })}
          </ul>
        )
      }}
    </AsyncWidget>
  )
}
