import { EmptyState } from '@/components/ui/EmptyState'
import { AsyncWidget } from '@/components/widget/AsyncWidget'
import { Gauge } from '@/components/widget/Gauge'
import { useWidgetData } from '@/hooks/useWidgetData'
import { api } from '@/lib/api'
import { cn } from '@/lib/cn'

type Dir = 'bull' | 'bear' | 'neutral'

interface CompositeData {
  symbol: string
  signals?: { label: string; dir: Dir }[]
  score?: number
  label?: string
  bullish?: number
  bearish?: number
  error?: string
}

const SIG: Record<Dir, { a: string; c: string; t: string }> = {
  bull: { a: '↑', c: 'text-up', t: 'Bullish' },
  bear: { a: '↓', c: 'text-down', t: 'Bearish' },
  neutral: { a: '→', c: 'text-muted-foreground', t: 'Neutral' },
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
  const query = useWidgetData<CompositeData>(
    () => api<CompositeData>(`/api/indicators/composite?symbol=${encodeURIComponent(symbol)}`),
    [symbol],
    { pollMs: 300_000 },
  )

  return (
    <AsyncWidget
      title={title}
      editMode={editMode}
      onRemove={onRemove}
      query={query}
      isEmpty={(d) => !!d.error || !d.signals?.length}
      empty={<EmptyState compact title="Signals unavailable" />}
    >
      {(data) => {
        const score = data.score ?? 0
        const signals = data.signals ?? []
        // Vibrant gradient arc in every state: bullish = emerald→cyan, bearish =
        // coral→amber, neutral = the signature blue→violet ring.
        const [color, colorTo] =
          score > 20
            ? ['var(--up)', '#22d3ee']
            : score < -20
              ? ['var(--down)', 'var(--accent-amber)']
              : ['var(--primary)', 'var(--accent-violet)']
        return (
          <div className="flex h-full flex-col justify-center gap-3">
            <div className="flex flex-col items-center">
              <Gauge
                value={score}
                min={-100}
                max={100}
                color={color}
                colorTo={colorTo}
                centerLabel={String(score)}
                centerSub={data.label}
              />
            </div>

            <div className="space-y-1.5 border-t border-border pt-2 text-xs">
              <div className="text-center text-[11px] text-muted-foreground">
                {data.bullish ?? 0}/{signals.length} signals bullish
                {(data.bearish ?? 0) > 0 && `, ${data.bearish}/${signals.length} bearish`}
              </div>
              {signals.map((s) => {
                const sig = SIG[s.dir]
                return (
                  <div key={s.label} className="flex items-center justify-between">
                    <span className="text-muted-foreground">{s.label}</span>
                    <span className={cn('font-medium', sig.c)}>
                      {sig.a} {sig.t}
                    </span>
                  </div>
                )
              })}
            </div>

            <p className="text-center text-[10px] leading-snug text-muted-foreground">
              Combines macro regime, DXY trend, MTF confluence, currency strength, news
              sentiment & real yields into one read for gold. A gut-check, not a trade signal.
            </p>
          </div>
        )
      }}
    </AsyncWidget>
  )
}
