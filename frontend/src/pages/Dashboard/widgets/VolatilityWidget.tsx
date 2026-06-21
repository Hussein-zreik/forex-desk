import { WidgetFrame } from '@/components/widget/WidgetFrame'
import { WidgetLoading } from '@/components/widget/WidgetLoading'
import { useWidgetData } from '@/hooks/useWidgetData'
import { api } from '@/lib/api'
import { cn } from '@/lib/cn'
import { fmtPrice } from '@/lib/format'

interface VolData {
  symbol: string
  atr?: number
  price?: number
  upper?: number
  lower?: number
  error?: string
}

interface Props {
  symbol?: string
  title?: string
  editMode?: boolean
  onRemove?: () => void
}

function Row({ label, value, cls }: { label: string; value?: number; cls?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={cn('text-sm tabular-nums', cls)}>{fmtPrice(value)}</span>
    </div>
  )
}

export function VolatilityWidget({
  symbol = 'XAU=F',
  title = 'Volatility Range — Gold',
  editMode,
  onRemove,
}: Props) {
  const { data, loading, error, refresh } = useWidgetData<VolData>(
    () => api(`/api/indicators/volatility?symbol=${encodeURIComponent(symbol)}`),
    [symbol],
    { pollMs: 300_000 },
  )

  return (
    <WidgetFrame
      title={title}
      editMode={editMode}
      onRemove={onRemove}
      onRefresh={refresh}
      loading={loading}
      error={data?.error ? 'ATR unavailable' : error}
    >
      {data && data.atr != null ? (
        <div className="flex h-full flex-col justify-center gap-2">
          <Row label="Projected High" value={data.upper} cls="text-up" />
          <Row label="Current" value={data.price} />
          <Row label="Projected Low" value={data.lower} cls="text-down" />
          <div className="mt-1 border-t border-border pt-2 text-center text-[11px] text-muted-foreground">
            Daily ATR {fmtPrice(data.atr)}
          </div>
        </div>
      ) : loading ? (
        <WidgetLoading />
      ) : null}
    </WidgetFrame>
  )
}
