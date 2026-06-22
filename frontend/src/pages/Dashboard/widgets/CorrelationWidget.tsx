import { WidgetFrame } from '@/components/widget/WidgetFrame'
import { WidgetLoading } from '@/components/widget/WidgetLoading'
import { useWidgetData } from '@/hooks/useWidgetData'
import { api } from '@/lib/api'

const SYMS = ['XAU=F', 'DX-Y.NYB', 'EURUSD=X', '^GSPC', 'BTC-USD']
const LABEL: Record<string, string> = {
  'XAU=F': 'XAU',
  'DX-Y.NYB': 'DXY',
  'EURUSD=X': 'EUR',
  '^GSPC': 'SPX',
  'BTC-USD': 'BTC',
}

interface CorrData {
  symbols: string[]
  matrix: (number | null)[][]
}

function cellColor(v: number | null): string {
  if (v == null) return 'transparent'
  const a = (Math.abs(v) * 0.55 + 0.08).toFixed(2)
  return v >= 0 ? `rgba(34,197,94,${a})` : `rgba(239,68,68,${a})`
}

interface Props {
  editMode?: boolean
  onRemove?: () => void
}

export function CorrelationWidget({ editMode, onRemove }: Props) {
  const { data, loading, error, refresh } = useWidgetData<CorrData>(
    () => api(`/api/correlation?symbols=${SYMS.join(',')}`),
    [],
    { pollMs: 300_000 },
  )

  return (
    <WidgetFrame
      title="Correlation Matrix"
      editMode={editMode}
      onRemove={onRemove}
      onRefresh={refresh}
      loading={loading}
      error={error}
    >
      {data?.matrix ? (
        <div className="flex h-full items-center justify-center overflow-auto">
          <table className="border-separate border-spacing-0.5 text-[10px]">
            <thead>
              <tr>
                <th />
                {data.symbols.map((s) => (
                  <th key={s} className="px-1 font-medium text-muted-foreground">
                    {LABEL[s] ?? s}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.matrix.map((row, i) => (
                <tr key={i}>
                  <td className="pr-1 text-right font-medium text-muted-foreground">
                    {LABEL[data.symbols[i]] ?? data.symbols[i]}
                  </td>
                  {row.map((v, j) => (
                    <td key={j}>
                      <div
                        className="flex h-6 w-9 items-center justify-center rounded tabular-nums"
                        style={{ backgroundColor: cellColor(v) }}
                      >
                        {v == null ? '—' : v.toFixed(1)}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : loading ? (
        <WidgetLoading />
      ) : null}
    </WidgetFrame>
  )
}
