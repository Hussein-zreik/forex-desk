import { EmptyState } from '@/components/ui/EmptyState'
import { AsyncWidget } from '@/components/widget/AsyncWidget'
import { Gauge } from '@/components/widget/Gauge'
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
  const query = useWidgetData<BiasData>(
    () => api<BiasData>(`/api/indicators/bias?symbol=${encodeURIComponent(symbol)}`),
    [symbol],
    { pollMs: 300_000 },
  )

  return (
    <AsyncWidget
      title={title}
      editMode={editMode}
      onRemove={onRemove}
      query={query}
      isEmpty={(d) => !!d.error || !d.label}
      empty={<EmptyState compact title="Indicator data unavailable" />}
    >
      {(data) => {
        const score = data.score ?? 0
        // Vibrant gradient arc in every state (no dull gray): bullish = emerald→
        // cyan, bearish = coral→amber, neutral = the signature blue→violet ring.
        const [color, colorTo] =
          score > 20
            ? ['var(--up)', '#22d3ee']
            : score < -20
              ? ['var(--down)', 'var(--accent-amber)']
              : ['var(--primary)', 'var(--accent-violet)']
        return (
          <div className="flex h-full flex-col items-center justify-center">
            <Gauge
              value={score}
              min={-100}
              max={100}
              color={color}
              colorTo={colorTo}
              centerLabel={String(score)}
              centerSub={data.label}
            />
            <div className="mt-1 flex flex-wrap justify-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
              {data.components?.rsi != null && <span>RSI {data.components.rsi}</span>}
              {data.components?.maCross && <span>MA {data.components.maCross}</span>}
              {data.components?.priceVsMa && <span>Px {data.components.priceVsMa} MA</span>}
            </div>
          </div>
        )
      }}
    </AsyncWidget>
  )
}
