import { useState } from 'react'
import { WidgetFrame } from '@/components/widget/WidgetFrame'
import { Input } from '@/components/ui/Input'
import { cn } from '@/lib/cn'

interface Props {
  editMode?: boolean
  onRemove?: () => void
}

// Gold: 1 standard lot = 100 troy oz; a $1 move = $100 / lot.
const OZ_PER_LOT = 100

function Field({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <label className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
      {label}
      <Input
        type="number"
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="no-drag h-8 w-28 text-right text-sm"
      />
    </label>
  )
}

export function GoldCalculatorWidget({ editMode, onRemove }: Props) {
  const [lots, setLots] = useState('1')
  const [entry, setEntry] = useState('2350')
  const [exit, setExit] = useState('2360')

  const l = parseFloat(lots) || 0
  const e = parseFloat(entry) || 0
  const x = parseFloat(exit) || 0
  const pnl = (x - e) * OZ_PER_LOT * l
  const notional = e * OZ_PER_LOT * l

  return (
    <WidgetFrame title="Gold Calculator" editMode={editMode} onRemove={onRemove}>
      <div className="flex h-full flex-col justify-center gap-2">
        <Field label="Lots (100oz)" value={lots} onChange={setLots} />
        <Field label="Entry" value={entry} onChange={setEntry} />
        <Field label="Exit" value={exit} onChange={setExit} />
        <div className="mt-1 flex items-center justify-between border-t border-border pt-2 text-sm">
          <span className="text-muted-foreground">P&amp;L</span>
          <span className={cn('font-semibold tabular-nums', pnl >= 0 ? 'text-up' : 'text-down')}>
            ${pnl.toFixed(2)}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Notional</span>
          <span className="tabular-nums">${notional.toLocaleString()}</span>
        </div>
      </div>
    </WidgetFrame>
  )
}
