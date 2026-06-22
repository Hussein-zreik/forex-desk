import { WidgetFrame } from '@/components/widget/WidgetFrame'
import { cn } from '@/lib/cn'

// Historical average monthly gold return (%), multi-year (static reference).
const MONTHLY = [
  { m: 'Jan', v: 1.3 },
  { m: 'Feb', v: 0.6 },
  { m: 'Mar', v: -0.3 },
  { m: 'Apr', v: 1.1 },
  { m: 'May', v: -0.2 },
  { m: 'Jun', v: -0.6 },
  { m: 'Jul', v: 1.0 },
  { m: 'Aug', v: 1.6 },
  { m: 'Sep', v: 0.8 },
  { m: 'Oct', v: -0.4 },
  { m: 'Nov', v: 1.2 },
  { m: 'Dec', v: 1.5 },
]

interface Props {
  editMode?: boolean
  onRemove?: () => void
}

export function SeasonalityWidget({ editMode, onRemove }: Props) {
  const max = Math.max(...MONTHLY.map((d) => Math.abs(d.v)))

  return (
    <WidgetFrame title="Gold Seasonality" editMode={editMode} onRemove={onRemove}>
      <div className="flex h-full flex-col">
        <div className="flex flex-1 items-end gap-1">
          {MONTHLY.map((d) => (
            <div key={d.m} className="flex flex-1 flex-col items-center justify-end gap-1">
              <div
                className={cn('w-full rounded-t', d.v >= 0 ? 'bg-up' : 'bg-down')}
                style={{ height: `${(Math.abs(d.v) / max) * 100}%`, minHeight: '2px' }}
              />
              <span className="text-[8px] text-muted-foreground">{d.m}</span>
            </div>
          ))}
        </div>
        <p className="mt-2 text-center text-[10px] text-muted-foreground">
          Avg monthly return · multi-year
        </p>
      </div>
    </WidgetFrame>
  )
}
