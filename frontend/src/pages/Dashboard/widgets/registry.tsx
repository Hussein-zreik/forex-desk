import { type ReactNode } from 'react'
import { BiasWidget } from './BiasWidget'
import { FearGreedWidget } from './FearGreedWidget'
import { QuoteCardWidget } from './QuoteCardWidget'
import { SessionsWidget } from './SessionsWidget'

export interface WidgetCtx {
  editMode: boolean
  onRemove: () => void
}

export interface WidgetDef {
  type: string
  title: string
  category: string
  w: number
  h: number
  minW: number
  minH: number
  render: (ctx: WidgetCtx) => ReactNode
}

export const WIDGETS: Record<string, WidgetDef> = {
  eurusd: {
    type: 'eurusd',
    title: 'EUR/USD',
    category: 'Quotes',
    w: 3,
    h: 3,
    minW: 2,
    minH: 3,
    render: (c) => <QuoteCardWidget symbol="EURUSD=X" title="EUR/USD" {...c} />,
  },
  gold: {
    type: 'gold',
    title: 'Gold (XAU/USD)',
    category: 'Quotes',
    w: 3,
    h: 3,
    minW: 2,
    minH: 3,
    render: (c) => <QuoteCardWidget symbol="XAU=F" title="Gold — XAU/USD" {...c} />,
  },
  dxy: {
    type: 'dxy',
    title: 'US Dollar Index',
    category: 'Quotes',
    w: 3,
    h: 3,
    minW: 2,
    minH: 3,
    render: (c) => <QuoteCardWidget symbol="DX-Y.NYB" title="US Dollar Index (DXY)" {...c} />,
  },
  sessions: {
    type: 'sessions',
    title: 'Trading Sessions',
    category: 'Market',
    w: 3,
    h: 4,
    minW: 2,
    minH: 4,
    render: (c) => <SessionsWidget {...c} />,
  },
  fearGreed: {
    type: 'fearGreed',
    title: 'Fear & Greed',
    category: 'Sentiment',
    w: 3,
    h: 5,
    minW: 2,
    minH: 4,
    render: (c) => <FearGreedWidget {...c} />,
  },
  bias: {
    type: 'bias',
    title: 'Composite Bias',
    category: 'Signals',
    w: 4,
    h: 5,
    minW: 3,
    minH: 4,
    render: (c) => <BiasWidget {...c} />,
  },
}

export const WIDGET_LIST = Object.values(WIDGETS)
