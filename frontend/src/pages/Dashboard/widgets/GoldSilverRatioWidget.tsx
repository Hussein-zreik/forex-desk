import { WidgetFrame } from '@/components/widget/WidgetFrame'
import { WidgetLoading } from '@/components/widget/WidgetLoading'
import { useWidgetData } from '@/hooks/useWidgetData'
import { api } from '@/lib/api'
import { fmtPrice } from '@/lib/format'
import { type Quote } from '@/store/useMarketData'

interface Props {
  editMode?: boolean
  onRemove?: () => void
}

export function GoldSilverRatioWidget({ editMode, onRemove }: Props) {
  const { data, loading, error, refresh } = useWidgetData<{ quotes: Quote[] }>(
    () => api('/api/quotes?symbols=XAU=F,XAG=F'),
    [],
    { pollMs: 60_000 },
  )

  const gold = data?.quotes.find((q) => q.symbol === 'XAU=F')?.price ?? null
  const silver = data?.quotes.find((q) => q.symbol === 'XAG=F')?.price ?? null
  const ratio = gold && silver ? gold / silver : null

  return (
    <WidgetFrame
      title="Gold / Silver Ratio"
      editMode={editMode}
      onRemove={onRemove}
      onRefresh={refresh}
      loading={loading}
      error={error}
    >
      {ratio != null ? (
        <div className="flex h-full flex-col items-center justify-center">
          <div className="text-3xl font-semibold tabular-nums">{ratio.toFixed(1)}</div>
          <div className="mt-1 text-xs text-muted-foreground">5y avg ~82 · high ~126</div>
          <div className="mt-3 text-[11px] text-muted-foreground">
            XAU {fmtPrice(gold)} · XAG {fmtPrice(silver)}
          </div>
        </div>
      ) : loading ? (
        <WidgetLoading />
      ) : (
        <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
          Waiting for prices…
        </div>
      )}
    </WidgetFrame>
  )
}
