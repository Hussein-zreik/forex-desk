import { EmptyState } from '@/components/ui/EmptyState'
import { AsyncWidget } from '@/components/widget/AsyncWidget'
import { Gauge } from '@/components/widget/Gauge'
import { Sparkline } from '@/components/widget/Sparkline'
import { useWidgetData } from '@/hooks/useWidgetData'
import { api } from '@/lib/api'

interface FngPoint {
  value: number
  timestamp: number
  classification: string | null
}
interface FngData {
  latest: FngPoint | null
  history: FngPoint[]
  error?: string
}

function fngColor(value: number): string {
  if (value < 25) return '#ef4444'
  if (value < 45) return '#f59e0b'
  if (value < 55) return '#eab308'
  if (value < 75) return '#84cc16'
  return '#22c55e'
}

interface Props {
  editMode?: boolean
  onRemove?: () => void
}

export function FearGreedWidget({ editMode, onRemove }: Props) {
  const query = useWidgetData<FngData>(() => api<FngData>('/api/fear-greed'), [], {
    pollMs: 600_000,
  })

  return (
    <AsyncWidget
      title="Fear & Greed"
      editMode={editMode}
      onRemove={onRemove}
      query={query}
      isEmpty={(d) => !!d.error || !d.latest}
      empty={<EmptyState compact title="Sentiment data unavailable" />}
    >
      {(data) => {
        const latest = data.latest!
        const color = fngColor(latest.value)
        return (
          <div className="flex h-full flex-col items-center justify-center">
            <Gauge
              value={latest.value}
              min={0}
              max={100}
              color={color}
              centerLabel={String(latest.value)}
              centerSub={latest.classification ?? ''}
            />
            {data.history.length > 1 && (
              <Sparkline
                values={data.history.map((h) => h.value)}
                color={color}
                className="mt-1 h-7 w-full"
              />
            )}
          </div>
        )
      }}
    </AsyncWidget>
  )
}
