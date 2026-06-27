import { WidgetFrame } from '@/components/widget/WidgetFrame'

// Relative historical volatility (0-100) by session × UTC hour bucket (static).
const HOURS = ['0-4', '4-8', '8-12', '12-16', '16-20', '20-24']
const ROWS: { name: string; values: number[] }[] = [
  { name: 'Tokyo', values: [55, 70, 40, 25, 20, 35] },
  { name: 'London', values: [20, 45, 85, 90, 60, 30] },
  { name: 'New York', values: [15, 25, 55, 95, 80, 40] },
]

function cell(v: number): string {
  // Blend accent glow by intensity.
  const alpha = (0.12 + (v / 100) * 0.6).toFixed(2)
  return `rgba(79,124,255,${alpha})`
}

interface Props {
  editMode?: boolean
  onRemove?: () => void
}

export function SessionHeatmapWidget({ editMode, onRemove }: Props) {
  return (
    <WidgetFrame title="Session Heatmap" editMode={editMode} onRemove={onRemove}>
      <div className="flex h-full flex-col justify-center gap-2">
        {ROWS.map((row) => (
          <div key={row.name} className="flex items-center gap-2">
            <span className="w-16 shrink-0 text-[11px] text-muted-foreground">{row.name}</span>
            <div className="flex flex-1 gap-1">
              {row.values.map((v, i) => (
                <div
                  key={i}
                  className="h-6 flex-1 rounded"
                  style={{ backgroundColor: cell(v) }}
                  title={`${row.name} ${HOURS[i]} UTC · ${v}`}
                />
              ))}
            </div>
          </div>
        ))}
        <div className="flex gap-1 pl-[72px]">
          {HOURS.map((h) => (
            <span key={h} className="flex-1 text-center text-[8px] text-muted-foreground">
              {h}
            </span>
          ))}
        </div>
      </div>
    </WidgetFrame>
  )
}
