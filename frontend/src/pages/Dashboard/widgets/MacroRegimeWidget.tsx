import { WidgetFrame } from '@/components/widget/WidgetFrame'
import { WidgetLoading } from '@/components/widget/WidgetLoading'
import { useWidgetData } from '@/hooks/useWidgetData'
import { api } from '@/lib/api'
import { cn } from '@/lib/cn'

interface MacroData {
  regime?: string
  vix?: number
  realYield?: number
  error?: string
}

interface Props {
  editMode?: boolean
  onRemove?: () => void
}

export function MacroRegimeWidget({ editMode, onRemove }: Props) {
  const { data, loading, error, refresh } = useWidgetData<MacroData>(
    () => api('/api/macro-regime'),
    [],
    { pollMs: 300_000 },
  )

  const regime = data?.regime
  const color =
    regime === 'RISK-ON' ? 'text-up' : regime === 'RISK-OFF' ? 'text-down' : 'text-muted-foreground'

  return (
    <WidgetFrame
      title="Macro Regime"
      editMode={editMode}
      onRemove={onRemove}
      onRefresh={refresh}
      loading={loading}
      error={data?.error ? 'Macro data unavailable' : error}
    >
      {data && !data.error && regime ? (
        <div className="flex h-full flex-col items-center justify-center gap-4">
          <div className={cn('text-2xl font-semibold tracking-tight', color)}>{regime}</div>
          <div className="flex gap-6 text-sm">
            <div className="text-center">
              <div className="text-[11px] text-muted-foreground">VIX</div>
              <div className="tabular-nums">{data.vix != null ? data.vix.toFixed(2) : '—'}</div>
            </div>
            <div className="text-center">
              <div className="text-[11px] text-muted-foreground">Real Yield</div>
              <div className="tabular-nums">
                {data.realYield != null ? `${data.realYield.toFixed(2)}%` : '—'}
              </div>
            </div>
          </div>
        </div>
      ) : loading ? (
        <WidgetLoading />
      ) : null}
    </WidgetFrame>
  )
}
