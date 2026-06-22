import { Badge } from '@/components/ui/Badge'
import { WidgetFrame } from '@/components/widget/WidgetFrame'

// Upcoming central-bank meetings (static reference schedule).
const MEETINGS = [
  { cb: 'ECB', ccy: 'EUR', date: 'Jul 24' },
  { cb: 'FOMC', ccy: 'USD', date: 'Jul 30' },
  { cb: 'BoJ', ccy: 'JPY', date: 'Jul 31' },
  { cb: 'RBA', ccy: 'AUD', date: 'Aug 5' },
  { cb: 'BoE', ccy: 'GBP', date: 'Aug 7' },
]

interface Props {
  editMode?: boolean
  onRemove?: () => void
}

export function CBCalendarWidget({ editMode, onRemove }: Props) {
  return (
    <WidgetFrame title="Central Bank Calendar" editMode={editMode} onRemove={onRemove}>
      <ul className="flex h-full flex-col justify-center gap-2 text-sm">
        {MEETINGS.map((m) => (
          <li key={m.cb} className="flex items-center justify-between">
            <span>
              <span className="font-medium">{m.cb}</span>{' '}
              <span className="text-[11px] text-muted-foreground">{m.ccy}</span>
            </span>
            <Badge>{m.date}</Badge>
          </li>
        ))}
      </ul>
    </WidgetFrame>
  )
}
