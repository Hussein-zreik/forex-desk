import { EmptyState } from '@/components/ui/EmptyState'
import { AsyncWidget } from '@/components/widget/AsyncWidget'
import { useWidgetData } from '@/hooks/useWidgetData'
import { api } from '@/lib/api'
import { cn } from '@/lib/cn'
import { signClass } from '@/lib/format'
import { symbolLabel } from '@/lib/symbols'

interface CotData {
  symbol: string
  date?: string
  longs?: number
  shorts?: number
  net?: number
  change?: number | null
  longPct?: number | null
  error?: string
}

interface Props {
  symbol?: string
  title?: string
  editMode?: boolean
  onRemove?: () => void
}

export function COTWidget({ symbol = 'XAU=F', title, editMode, onRemove }: Props) {
  const query = useWidgetData<CotData>(
    () => api(`/api/cot?symbol=${encodeURIComponent(symbol)}`),
    [symbol],
    { pollMs: 3_600_000 },
  )

  return (
    <AsyncWidget
      title={title ?? `COT — ${symbolLabel(symbol)}`}
      editMode={editMode}
      onRemove={onRemove}
      query={query}
      isEmpty={(d) => !!d.error || d.net == null}
      empty={<EmptyState compact title="COT data unavailable" />}
    >
      {(d) => {
        const longPct = d.longPct ?? 50
        const net = d.net ?? 0
        return (
          <div className="flex h-full flex-col justify-center gap-3">
            <div className="text-center">
              <div className="text-[11px] tracking-wide text-muted-foreground uppercase">
                Net speculative
              </div>
              <div
                className={cn(
                  'text-2xl font-semibold tabular-nums',
                  net > 0 ? 'text-up' : net < 0 ? 'text-down' : 'text-foreground',
                )}
              >
                {net > 0 ? '+' : ''}
                {net.toLocaleString()}
              </div>
              {d.change != null && (
                <div className={cn('text-[11px] tabular-nums', signClass(d.change))}>
                  {d.change >= 0 ? '▲' : '▼'} {Math.abs(d.change).toLocaleString()} wk
                </div>
              )}
            </div>
            <div>
              <div className="flex h-2 w-full overflow-hidden rounded-full bg-surface">
                <div className="bg-up" style={{ width: `${longPct}%` }} />
                <div className="bg-down" style={{ width: `${100 - longPct}%` }} />
              </div>
              <div className="mt-1 flex justify-between text-[11px] tabular-nums">
                <span className="text-up">L {(d.longs ?? 0).toLocaleString()}</span>
                <span className="text-muted-foreground">{longPct.toFixed(0)}% long</span>
                <span className="text-down">S {(d.shorts ?? 0).toLocaleString()}</span>
              </div>
            </div>
            {d.date && (
              <div className="text-center text-[10px] text-muted-foreground">As of {d.date}</div>
            )}
          </div>
        )
      }}
    </AsyncWidget>
  )
}
