import { EmptyState } from '@/components/ui/EmptyState'
import { AsyncWidget } from '@/components/widget/AsyncWidget'
import { Sparkline } from '@/components/widget/Sparkline'
import { SourceLink } from '@/components/widget/SourceLink'
import { useWidgetData } from '@/hooks/useWidgetData'
import { api } from '@/lib/api'

interface RealYieldData {
  value?: number
  date?: string
  trend?: string
  breakeven?: number | null
  history?: number[]
  error?: string
}

interface Props {
  editMode?: boolean
  onRemove?: () => void
}

export function RealYieldWidget({ editMode, onRemove }: Props) {
  const query = useWidgetData<RealYieldData>(() => api('/api/real-yield'), [], {
    pollMs: 3_600_000,
  })

  return (
    <AsyncWidget
      title="10Y Real Yield"
      editMode={editMode}
      onRemove={onRemove}
      query={query}
      isEmpty={(d) => !!d.error || d.value == null}
      empty={<EmptyState compact title="FRED data unavailable" />}
    >
      {(data) => (
        <div className="flex h-full flex-col items-center justify-center">
          <div className="text-3xl font-semibold tabular-nums">{data.value!.toFixed(2)}%</div>
          <div className="mt-1 text-xs text-muted-foreground">10Y TIPS (DFII10) · {data.trend}</div>
          {data.breakeven != null && (
            <div className="mt-1 text-xs text-muted-foreground">
              Breakeven inflation{' '}
              <span className="font-medium text-foreground tabular-nums">
                {data.breakeven.toFixed(2)}%
              </span>
            </div>
          )}
          {data.history && data.history.length > 1 && (
            <Sparkline
              values={data.history}
              color={data.trend === 'up' ? 'var(--up)' : 'var(--down)'}
              className="mt-3 h-7 w-full"
            />
          )}
          <SourceLink name="FRED" href="https://fred.stlouisfed.org/series/DFII10" />
        </div>
      )}
    </AsyncWidget>
  )
}
