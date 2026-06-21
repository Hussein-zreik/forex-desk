import { Gauge } from '@/components/widget/Gauge'
import { WidgetFrame } from '@/components/widget/WidgetFrame'
import { WidgetLoading } from '@/components/widget/WidgetLoading'
import { useWidgetData } from '@/hooks/useWidgetData'
import { api } from '@/lib/api'

interface BiasData {
  symbol: string
  score?: number
  label?: string
  components?: { rsi?: number; maCross?: string; priceVsMa?: string }
  error?: string
}

interface Props {
  symbol?: string
  title?: string
  editMode?: boolean
  onRemove?: () => void
}

export function BiasWidget({
  symbol = 'XAU=F',
  title = 'Composite Bias — Gold',
  editMode,
  onRemove,
}: Props) {
  const { data, loading, error, refresh } = useWidgetData<BiasData>(
    () => api<BiasData>(`/api/indicators/bias?symbol=${encodeURIComponent(symbol)}`),
    [symbol],
    { pollMs: 300_000 },
  )

  const score = data?.score ?? 0
  const color = score > 20 ? 'var(--up)' : score < -20 ? 'var(--down)' : 'var(--muted-foreground)'

  return (
    <WidgetFrame
      title={title}
      editMode={editMode}
      onRemove={onRemove}
      onRefresh={refresh}
      loading={loading}
      error={data?.error ? 'Indicator data unavailable' : error}
    >
      {data && !data.error && data.label ? (
        <div className="flex h-full flex-col items-center justify-center">
          <Gauge
            value={score}
            min={-100}
            max={100}
            color={color}
            centerLabel={String(score)}
            centerSub={data.label}
          />
          <div className="mt-1 flex flex-wrap justify-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
            {data.components?.rsi != null && <span>RSI {data.components.rsi}</span>}
            {data.components?.maCross && <span>MA {data.components.maCross}</span>}
            {data.components?.priceVsMa && <span>Px {data.components.priceVsMa} MA</span>}
          </div>
        </div>
      ) : loading ? (
        <WidgetLoading />
      ) : null}
    </WidgetFrame>
  )
}
