import { Clock3 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { WidgetFrame } from '@/components/widget/WidgetFrame'
import { cn } from '@/lib/cn'
import { sessionStatuses } from '@/utils/sessionCalc'

interface Props {
  editMode?: boolean
  onRemove?: () => void
}

export function SessionsWidget({ editMode, onRemove }: Props) {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const statuses = sessionStatuses(now)

  return (
    <WidgetFrame
      title="Trading Sessions"
      icon={<Clock3 className="h-3.5 w-3.5 text-primary" />}
      editMode={editMode}
      onRemove={onRemove}
    >
      <ul className="flex h-full flex-col justify-center gap-2.5">
        {statuses.map((s) => (
          <li key={s.name} className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <span
                className={cn(
                  'h-2 w-2 rounded-full',
                  s.open ? 'bg-up shadow-[0_0_8px_var(--up)]' : 'bg-muted-foreground/40',
                )}
              />
              <span className="text-sm">{s.name}</span>
            </span>
            <span className="text-right">
              <span
                className={cn(
                  'block text-xs font-medium',
                  s.open ? 'text-up' : 'text-muted-foreground',
                )}
              >
                {s.open ? 'OPEN' : 'CLOSED'}
              </span>
              <span className="block text-[11px] text-muted-foreground">{s.label}</span>
            </span>
          </li>
        ))}
      </ul>
    </WidgetFrame>
  )
}
