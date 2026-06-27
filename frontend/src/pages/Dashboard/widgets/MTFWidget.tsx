import { EmptyState } from '@/components/ui/EmptyState'
import { AsyncWidget } from '@/components/widget/AsyncWidget'
import { useWidgetData } from '@/hooks/useWidgetData'
import { api } from '@/lib/api'
import { cn } from '@/lib/cn'

interface Tf {
  tf: string
  label: string
  score: number
}
interface MtfData {
  symbol: string
  timeframes: Tf[]
  overall: string
  score: number
  error?: string
}

const SIG: Record<string, { c: string; a: string; cell: string }> = {
  BULLISH: { c: 'text-up', a: '↑', cell: 'border-up/30 bg-up/10' },
  BEARISH: { c: 'text-down', a: '↓', cell: 'border-down/30 bg-down/10' },
  NEUTRAL: { c: 'text-primary', a: '→', cell: 'border-primary/30 bg-primary/10' },
  'N/A': { c: 'text-muted-foreground', a: '·', cell: 'border-border bg-surface' },
}

interface Props {
  symbol?: string
  title?: string
  editMode?: boolean
  onRemove?: () => void
}

export function MTFWidget({
  symbol = 'XAU=F',
  title = 'MTF Confluence — Gold',
  editMode,
  onRemove,
}: Props) {
  const query = useWidgetData<MtfData>(
    () => api(`/api/indicators/mtf?symbol=${encodeURIComponent(symbol)}`),
    [symbol],
    { pollMs: 300_000 },
  )

  return (
    <AsyncWidget
      title={title}
      editMode={editMode}
      onRemove={onRemove}
      query={query}
      isEmpty={(d) => !!d.error || !d.timeframes}
      empty={<EmptyState compact title="MTF unavailable" />}
    >
      {(data) => (
        <div className="flex h-full flex-col justify-center gap-3">
          <div className="grid grid-cols-3 gap-2">
            {data.timeframes.map((t) => {
              const s = SIG[t.label] ?? SIG['N/A']
              return (
                <div key={t.tf} className={cn('rounded-lg border p-2 text-center', s.cell)}>
                  <div className="text-[11px] text-muted-foreground">{t.tf}</div>
                  <div className={cn('text-xl font-semibold', s.c)}>{s.a}</div>
                </div>
              )
            })}
          </div>
          <div className="text-center text-sm">
            Overall{' '}
            <span className={cn('font-semibold', (SIG[data.overall] ?? SIG['N/A']).c)}>
              {data.overall}
            </span>
          </div>
        </div>
      )}
    </AsyncWidget>
  )
}
