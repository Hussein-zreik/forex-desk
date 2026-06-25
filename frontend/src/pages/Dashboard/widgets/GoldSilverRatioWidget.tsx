import { EmptyState } from '@/components/ui/EmptyState'
import { AsyncWidget } from '@/components/widget/AsyncWidget'
import { useWidgetData } from '@/hooks/useWidgetData'
import { api } from '@/lib/api'
import { fmtPrice } from '@/lib/format'
import { type Quote } from '@/store/useMarketData'

const priceOf = (quotes: Quote[], symbol: string) =>
  quotes.find((q) => q.symbol === symbol)?.price ?? null

interface Props {
  editMode?: boolean
  onRemove?: () => void
}

export function GoldSilverRatioWidget({ editMode, onRemove }: Props) {
  const query = useWidgetData<{ quotes: Quote[] }>(
    () => api('/api/quotes?symbols=XAU=F,XAG=F'),
    [],
    {
      pollMs: 60_000,
    },
  )

  return (
    <AsyncWidget
      title="Gold / Silver Ratio"
      editMode={editMode}
      onRemove={onRemove}
      query={query}
      isEmpty={(d) => priceOf(d.quotes, 'XAU=F') == null || priceOf(d.quotes, 'XAG=F') == null}
      empty={<EmptyState compact title="Waiting for prices…" />}
    >
      {(d) => {
        const gold = priceOf(d.quotes, 'XAU=F')!
        const silver = priceOf(d.quotes, 'XAG=F')!
        return (
          <div className="flex h-full flex-col items-center justify-center">
            <div className="text-3xl font-semibold tabular-nums">{(gold / silver).toFixed(1)}</div>
            <div className="mt-1 text-xs text-muted-foreground">5y avg ~82 · high ~126</div>
            <div className="mt-3 text-[11px] text-muted-foreground">
              XAU {fmtPrice(gold)} · XAG {fmtPrice(silver)}
            </div>
          </div>
        )
      }}
    </AsyncWidget>
  )
}
