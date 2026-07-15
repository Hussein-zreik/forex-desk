import { useState } from 'react'
import { WidgetFrame } from '@/components/widget/WidgetFrame'
import { useSettings } from '@/store/useSettings'

interface Props {
  editMode?: boolean
  onRemove?: () => void
}

const SYMBOLS = [
  { value: 'OANDA:XAUUSD', label: 'XAU/USD' },
  { value: 'FX:EURUSD', label: 'EUR/USD' },
  { value: 'FX:GBPUSD', label: 'GBP/USD' },
  { value: 'FX:USDJPY', label: 'USD/JPY' },
  { value: 'TVC:DXY', label: 'DXY' },
  { value: 'BITSTAMP:BTCUSD', label: 'BTC/USD' },
  { value: 'TVC:USOIL', label: 'US Oil' },
  { value: 'SP:SPX', label: 'S&P 500' },
]

export function TradingViewWidget({ editMode, onRemove }: Props) {
  const theme = useSettings((s) => s.theme)
  const [symbol, setSymbol] = useState('OANDA:XAUUSD')

  const src =
    `https://s.tradingview.com/widgetembed/?frameElementId=tv_chart&symbol=${encodeURIComponent(symbol)}` +
    `&interval=60&theme=${theme}&style=1&hideideas=1&hidesidetoolbar=1&withdateranges=1&saveimage=0`

  return (
    <WidgetFrame title="Live Chart" editMode={editMode} onRemove={onRemove}>
      <div className="flex h-full flex-col gap-2">
        <select
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          className="no-drag h-8 w-fit rounded-lg border border-input bg-bg-elevated px-2 text-xs text-foreground"
        >
          {SYMBOLS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <iframe
          key={src}
          src={src}
          title="TradingView chart"
          className="min-h-0 w-full flex-1 rounded-xl border border-border bg-bg-elevated"
          loading="lazy"
        />
      </div>
    </WidgetFrame>
  )
}
