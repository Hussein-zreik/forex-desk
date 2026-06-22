import { Sparkline } from '@/components/widget/Sparkline'
import { WidgetFrame } from '@/components/widget/WidgetFrame'
import { WidgetLoading } from '@/components/widget/WidgetLoading'
import { useWidgetData } from '@/hooks/useWidgetData'
import { api } from '@/lib/api'

interface RealYieldData {
  value?: number
  date?: string
  trend?: string
  history?: number[]
  error?: string
}

interface Props {
  editMode?: boolean
  onRemove?: () => void
}

export function RealYieldWidget({ editMode, onRemove }: Props) {
  const { data, loading, error, refresh } = useWidgetData<RealYieldData>(
    () => api('/api/real-yield'),
    [],
    { pollMs: 3_600_000 },
  )

  return (
    <WidgetFrame
      title="10Y Real Yield"
      editMode={editMode}
      onRemove={onRemove}
      onRefresh={refresh}
      loading={loading}
      error={data?.error ? 'FRED data unavailable' : error}
    >
      {data && data.value != null ? (
        <div className="flex h-full flex-col items-center justify-center">
          <div className="text-3xl font-semibold tabular-nums">{data.value.toFixed(2)}%</div>
          <div className="mt-1 text-xs text-muted-foreground">10Y TIPS (DFII10) · {data.trend}</div>
          {data.history && data.history.length > 1 && (
            <Sparkline
              values={data.history}
              color={data.trend === 'up' ? 'var(--up)' : 'var(--down)'}
              className="mt-3 h-7 w-full"
            />
          )}
        </div>
      ) : loading ? (
        <WidgetLoading />
      ) : null}
    </WidgetFrame>
  )
}
