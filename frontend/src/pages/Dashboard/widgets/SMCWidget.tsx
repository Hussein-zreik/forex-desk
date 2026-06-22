import { StatRow } from '@/components/widget/StatRow'
import { WidgetFrame } from '@/components/widget/WidgetFrame'
import { WidgetLoading } from '@/components/widget/WidgetLoading'
import { useWidgetData } from '@/hooks/useWidgetData'
import { api } from '@/lib/api'
import { cn } from '@/lib/cn'
import { fmtPrice } from '@/lib/format'

interface SmcData {
  symbol: string
  structure?: string
  price?: number
  swingHigh?: number
  swingLow?: number
  fvg?: { type: string; from: number; to: number } | null
  error?: string
}

interface Props {
  symbol?: string
  title?: string
  editMode?: boolean
  onRemove?: () => void
}

export function SMCWidget({
  symbol = 'XAU=F',
  title = 'Smart Money — Gold',
  editMode,
  onRemove,
}: Props) {
  const { data, loading, error, refresh } = useWidgetData<SmcData>(
    () => api(`/api/indicators/smc?symbol=${encodeURIComponent(symbol)}`),
    [symbol],
    { pollMs: 300_000 },
  )

  const struct = data?.structure
  const color = struct?.includes('↑')
    ? 'text-up'
    : struct?.includes('↓')
      ? 'text-down'
      : 'text-muted-foreground'

  return (
    <WidgetFrame
      title={title}
      editMode={editMode}
      onRemove={onRemove}
      onRefresh={refresh}
      loading={loading}
      error={data?.error ? 'SMC unavailable' : error}
    >
      {data && data.price != null ? (
        <div className="flex h-full flex-col justify-center gap-2">
          <div className={cn('text-center text-lg font-semibold', color)}>{struct}</div>
          <StatRow label="Swing resistance" value={fmtPrice(data.swingHigh)} cls="text-up" />
          <StatRow label="Price" value={fmtPrice(data.price)} />
          <StatRow label="Swing support" value={fmtPrice(data.swingLow)} cls="text-down" />
          {data.fvg && (
            <div className="mt-1 rounded-lg border border-border bg-surface px-2 py-1 text-center text-[11px]">
              <span className={data.fvg.type === 'bullish' ? 'text-up' : 'text-down'}>
                FVG {data.fvg.type}
              </span>{' '}
              {fmtPrice(data.fvg.from)}–{fmtPrice(data.fvg.to)}
            </div>
          )}
        </div>
      ) : loading ? (
        <WidgetLoading />
      ) : null}
    </WidgetFrame>
  )
}
