import { EmptyState } from '@/components/ui/EmptyState'
import { AsyncWidget } from '@/components/widget/AsyncWidget'
import { Gauge } from '@/components/widget/Gauge'
import { useWidgetData } from '@/hooks/useWidgetData'
import { api } from '@/lib/api'
import { cn } from '@/lib/cn'

interface BiasData {
  symbol: string
  score?: number
  label?: string
  components?: { rsi?: number; maCross?: string; priceVsMa?: string }
  error?: string
}

type Dir = 'bull' | 'bear' | 'neutral'
const SIG: Record<Dir, { a: string; c: string; t: string }> = {
  bull: { a: '↑', c: 'text-up', t: 'Bullish' },
  bear: { a: '↓', c: 'text-down', t: 'Bearish' },
  neutral: { a: '→', c: 'text-muted-foreground', t: 'Neutral' },
}
const dir = (n: number): Dir => (n > 0 ? 'bull' : n < 0 ? 'bear' : 'neutral')
const wordDir = (s?: string): Dir =>
  /bull|above|up/i.test(s ?? '') ? 'bull' : /bear|below|down/i.test(s ?? '') ? 'bear' : 'neutral'

/** Build labelled signal rows from whatever components the API returned. */
function biasSignals(c?: BiasData['components']): { label: string; dir: Dir }[] {
  if (!c) return []
  const rows: { label: string; dir: Dir }[] = []
  if (c.rsi != null) rows.push({ label: 'RSI', dir: dir(c.rsi - 50) })
  if (c.maCross) rows.push({ label: 'MA Cross', dir: wordDir(c.maCross) })
  if (c.priceVsMa) rows.push({ label: 'Price vs MA', dir: wordDir(c.priceVsMa) })
  return rows
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
        const rows = biasSignals(data.components)
        const bulls = rows.filter((r) => r.dir === 'bull').length
        const bears = rows.filter((r) => r.dir === 'bear').length
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

            {rows.length > 0 && (
              <div className="space-y-1.5 border-t border-border pt-2 text-xs">
                <div className="text-center text-[11px] text-muted-foreground">
                  {bulls}/{rows.length} signals bullish
                  {bears > 0 && `, ${bears}/${rows.length} bearish`}
                </div>
                {rows.map((r) => {
                  const s = SIG[r.dir]
                  return (
                    <div key={r.label} className="flex items-center justify-between">
                      <span className="text-muted-foreground">{r.label}</span>
                      <span className={cn('font-medium', s.c)}>
                        {s.a} {s.t}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}

            <p className="text-center text-[10px] leading-snug text-muted-foreground">
              Combines RSI, MA cross and price vs MA into one directional read. A gut-check, not a
              trade signal.
            </p>
          </div>
        )
      }}
    </AsyncWidget>
  )
}
