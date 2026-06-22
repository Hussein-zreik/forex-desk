import { WidgetFrame } from '@/components/widget/WidgetFrame'
import { WidgetLoading } from '@/components/widget/WidgetLoading'
import { useWidgetData } from '@/hooks/useWidgetData'
import { api } from '@/lib/api'
import { cn } from '@/lib/cn'

interface EtfEntry {
  volume: number
  avg20: number
  ratio: number | null
}
interface EtfData {
  etfs: Record<string, EtfEntry | null>
  error?: string
}

interface Props {
  editMode?: boolean
  onRemove?: () => void
}

export function ETFFlowWidget({ editMode, onRemove }: Props) {
  const { data, loading, error, refresh } = useWidgetData<EtfData>(() => api('/api/etf-flow'), [], {
    pollMs: 300_000,
  })

  const entries = Object.entries(data?.etfs ?? {})
  const hasData = entries.some(([, v]) => v)

  return (
    <WidgetFrame
      title="Gold ETF Flow"
      editMode={editMode}
      onRemove={onRemove}
      onRefresh={refresh}
      loading={loading}
      error={error}
    >
      {hasData ? (
        <div className="flex h-full flex-col justify-center gap-3">
          {entries.map(([sym, v]) => (
            <div key={sym}>
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{sym}</span>
                {v ? (
                  <span
                    className={cn(
                      'tabular-nums',
                      v.ratio && v.ratio >= 1 ? 'text-up' : 'text-down',
                    )}
                  >
                    {v.ratio ? `${v.ratio}×` : '—'} avg
                  </span>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </div>
              {v && (
                <div className="mt-1 text-[11px] text-muted-foreground">
                  Vol {v.volume.toLocaleString()} · 20d {v.avg20.toLocaleString()}
                </div>
              )}
            </div>
          ))}
          <p className="text-center text-[10px] text-muted-foreground">
            Volume vs 20-day average (flow proxy)
          </p>
        </div>
      ) : loading ? (
        <WidgetLoading />
      ) : (
        <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
          Flow data unavailable
        </div>
      )}
    </WidgetFrame>
  )
}
