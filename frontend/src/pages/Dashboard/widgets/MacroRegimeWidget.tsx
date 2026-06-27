import { EmptyState } from '@/components/ui/EmptyState'
import { AsyncWidget } from '@/components/widget/AsyncWidget'
import { SourceLink } from '@/components/widget/SourceLink'
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
  const query = useWidgetData<MacroData>(() => api('/api/macro-regime'), [], { pollMs: 300_000 })

  return (
    <AsyncWidget
      title="Macro Regime"
      editMode={editMode}
      onRemove={onRemove}
      query={query}
      isEmpty={(d) => !!d.error || !d.regime}
      empty={<EmptyState compact title="Macro data unavailable" />}
    >
      {(data) => {
        const color =
          data.regime === 'RISK-ON'
            ? 'text-up'
            : data.regime === 'RISK-OFF'
              ? 'text-down'
              : 'text-muted-foreground'
        return (
          <div className="flex h-full flex-col items-center justify-center gap-4">
            <div className={cn('text-2xl font-semibold tracking-tight', color)}>{data.regime}</div>
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
            <SourceLink name="Yahoo · FRED" href="https://fred.stlouisfed.org/series/DFII10" />
          </div>
        )
      }}
    </AsyncWidget>
  )
}
