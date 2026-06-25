import { EmptyState } from '@/components/ui/EmptyState'
import { AsyncWidget } from '@/components/widget/AsyncWidget'
import { StatRow } from '@/components/widget/StatRow'
import { useWidgetData } from '@/hooks/useWidgetData'
import { api } from '@/lib/api'
import { cn } from '@/lib/cn'
import { fmtPrice } from '@/lib/format'

interface HiLoData {
  symbol: string
  days?: number
  high?: number
  low?: number
  price?: number
  status?: string
  error?: string
}

interface Props {
  symbol?: string
  title?: string
  editMode?: boolean
  onRemove?: () => void
}

export function HiLoWidget({
  symbol = 'XAU=F',
  title = 'Hi-Lo Breakout — Gold',
  editMode,
  onRemove,
}: Props) {
  const query = useWidgetData<HiLoData>(
    () => api(`/api/indicators/hilo?symbol=${encodeURIComponent(symbol)}`),
    [symbol],
    { pollMs: 300_000 },
  )

  return (
    <AsyncWidget
      title={title}
      editMode={editMode}
      onRemove={onRemove}
      query={query}
      isEmpty={(d) => !!d.error || d.price == null}
      empty={<EmptyState compact title="Range unavailable" />}
    >
      {(data) => {
        const status = data.status
        const color =
          status === 'breakout-up'
            ? 'text-up'
            : status === 'breakout-down'
              ? 'text-down'
              : 'text-muted-foreground'
        const label =
          status === 'breakout-up'
            ? 'BREAKOUT ↑'
            : status === 'breakout-down'
              ? 'BREAKDOWN ↓'
              : 'IN RANGE'
        return (
          <div className="flex h-full flex-col justify-center gap-2">
            <div className={cn('text-center text-lg font-semibold', color)}>{label}</div>
            <StatRow label={`${data.days}d High`} value={fmtPrice(data.high)} cls="text-up" />
            <StatRow label="Price" value={fmtPrice(data.price)} />
            <StatRow label={`${data.days}d Low`} value={fmtPrice(data.low)} cls="text-down" />
          </div>
        )
      }}
    </AsyncWidget>
  )
}
