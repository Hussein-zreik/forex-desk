import { useState } from 'react'
import { Input } from '@/components/ui/Input'
import { WidgetFrame } from '@/components/widget/WidgetFrame'
import { cn } from '@/lib/cn'
import { positionSize, riskReward } from '@/lib/risk'
import { symbolLabel } from '@/lib/symbols'

interface Props {
  symbol?: string
  title?: string
  editMode?: boolean
  onRemove?: () => void
}

function Row({
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
        className="no-drag h-8 w-24 text-right text-sm"
      />
    </label>
  )
}

function Out({ label, value, cls }: { label: string; value: string; cls?: string }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn('tabular-nums', cls)}>{value}</span>
    </div>
  )
}

export function RiskCalcWidget({ symbol = 'EURUSD=X', title, editMode, onRemove }: Props) {
  const [balance, setBalance] = useState('10000')
  const [risk, setRisk] = useState('1')
  const [entry, setEntry] = useState('')
  const [stop, setStop] = useState('')
  const [target, setTarget] = useState('')

  const e = parseFloat(entry)
  const s = parseFloat(stop)
  const t = parseFloat(target)
  const res = positionSize({
    balance: parseFloat(balance),
    riskPct: parseFloat(risk),
    entry: e,
    stop: s,
    symbol,
  })
  const rr = !Number.isNaN(t) ? riskReward(e, s, t) : null

  return (
    <WidgetFrame
      title={title ?? `Risk Calc — ${symbolLabel(symbol)}`}
      editMode={editMode}
      onRemove={onRemove}
    >
      <div className="flex h-full flex-col gap-1.5">
        <Row label="Balance ($)" value={balance} onChange={setBalance} />
        <Row label="Risk (%)" value={risk} onChange={setRisk} />
        <Row label="Entry" value={entry} onChange={setEntry} />
        <Row label="Stop" value={stop} onChange={setStop} />
        <Row label="Target (opt.)" value={target} onChange={setTarget} />
        <div className="mt-1 space-y-1 border-t border-border pt-2">
          {res ? (
            <>
              <Out
                label="Position"
                value={`${res.lots.toFixed(2)} lots`}
                cls="font-semibold text-foreground"
              />
              <Out label="Units" value={Math.round(res.units).toLocaleString()} />
              <Out label="Risk" value={`$${res.riskUsd.toLocaleString()}`} cls="text-down" />
              <Out label="Stop distance" value={`${res.stopPips.toFixed(0)} pips`} />
              <Out label="Pip value" value={`$${res.pipValueUsd.toFixed(2)}/lot`} />
              {rr != null && (
                <Out
                  label="Reward : Risk"
                  value={`${rr.toFixed(2)}R`}
                  cls={rr >= 1 ? 'text-up' : 'text-down'}
                />
              )}
            </>
          ) : (
            <p className="py-2 text-center text-xs text-muted-foreground">
              Enter entry &amp; stop to size the trade.
            </p>
          )}
        </div>
      </div>
    </WidgetFrame>
  )
}
