import { WidgetFrame } from '@/components/widget/WidgetFrame'
import { WidgetLoading } from '@/components/widget/WidgetLoading'
import { useWidgetData } from '@/hooks/useWidgetData'
import { api } from '@/lib/api'
import { cn } from '@/lib/cn'

interface EcoRow {
  currency: string
  beats: number
  misses: number
}

interface Props {
  editMode?: boolean
  onRemove?: () => void
}

export function EcoSurprisesWidget({ editMode, onRemove }: Props) {
  const { data, loading, error, refresh } = useWidgetData<EcoRow[]>(
    () => api('/api/eco-surprises'),
    [],
  )
  const rows = data ?? []

  async function adjust(currency: string, field: 'beats' | 'misses', delta: number) {
    await api('/api/eco-surprises', {
      method: 'POST',
      body: JSON.stringify({ currency, field, delta }),
    })
    await refresh()
  }

  return (
    <WidgetFrame
      title="Eco Surprises"
      editMode={editMode}
      onRemove={onRemove}
      onRefresh={refresh}
      loading={loading}
      error={error}
    >
      {rows.length > 0 ? (
        <ul className="flex h-full flex-col justify-center gap-1 text-xs">
          {rows.map((r) => {
            const net = r.beats - r.misses
            return (
              <li key={r.currency} className="flex items-center gap-1.5">
                <span className="w-8 font-medium">{r.currency}</span>
                <button
                  type="button"
                  onClick={() => adjust(r.currency, 'beats', 1)}
                  className="no-drag h-5 w-5 rounded bg-surface text-up hover:bg-surface-hover"
                  aria-label={`Add ${r.currency} beat`}
                >
                  +
                </button>
                <span className="w-4 text-center tabular-nums text-up">{r.beats}</span>
                <button
                  type="button"
                  onClick={() => adjust(r.currency, 'misses', 1)}
                  className="no-drag h-5 w-5 rounded bg-surface text-down hover:bg-surface-hover"
                  aria-label={`Add ${r.currency} miss`}
                >
                  −
                </button>
                <span className="w-4 text-center tabular-nums text-down">{r.misses}</span>
                <span
                  className={cn(
                    'ml-auto tabular-nums',
                    net > 0 ? 'text-up' : net < 0 ? 'text-down' : 'text-muted-foreground',
                  )}
                >
                  {net > 0 ? '+' : ''}
                  {net}
                </span>
              </li>
            )
          })}
        </ul>
      ) : loading ? (
        <WidgetLoading />
      ) : null}
    </WidgetFrame>
  )
}
