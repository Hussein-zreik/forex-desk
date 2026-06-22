import { type ReactNode } from 'react'
import { BiasWidget } from './BiasWidget'
import { CryptoWidget } from './CryptoWidget'
import { FearGreedWidget } from './FearGreedWidget'
import { GoldCalculatorWidget } from './GoldCalculatorWidget'
import { GoldSilverRatioWidget } from './GoldSilverRatioWidget'
import { MacroRegimeWidget } from './MacroRegimeWidget'
import { NewsSentimentWidget } from './NewsSentimentWidget'
import { NewsWidget } from './NewsWidget'
import { PivotsWidget } from './PivotsWidget'
import { RealYieldWidget } from './RealYieldWidget'
import { QuoteCardWidget } from './QuoteCardWidget'
import { RoundNumbersWidget } from './RoundNumbersWidget'
import { SessionsWidget } from './SessionsWidget'
import { TradingViewWidget } from './TradingViewWidget'
import { VolatilityWidget } from './VolatilityWidget'

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
  pivots: {
    type: 'pivots',
    title: 'Pivot Points',
    category: 'Levels',
    w: 3,
    h: 5,
    minW: 2,
    minH: 4,
    render: (c) => <PivotsWidget {...c} />,
  },
  volatility: {
    type: 'volatility',
    title: 'Volatility Range',
    category: 'Signals',
    w: 3,
    h: 4,
    minW: 2,
    minH: 4,
    render: (c) => <VolatilityWidget {...c} />,
  },
  goldSilver: {
    type: 'goldSilver',
    title: 'Gold / Silver Ratio',
    category: 'Metals',
    w: 3,
    h: 4,
    minW: 2,
    minH: 3,
    render: (c) => <GoldSilverRatioWidget {...c} />,
  },
  crypto: {
    type: 'crypto',
    title: 'Crypto Prices',
    category: 'Quotes',
    w: 4,
    h: 5,
    minW: 3,
    minH: 4,
    render: (c) => <CryptoWidget {...c} />,
  },
  roundNumbers: {
    type: 'roundNumbers',
    title: 'Round Numbers',
    category: 'Levels',
    w: 3,
    h: 5,
    minW: 2,
    minH: 4,
    render: (c) => <RoundNumbersWidget {...c} />,
  },
  calculator: {
    type: 'calculator',
    title: 'Gold Calculator',
    category: 'Tools',
    w: 3,
    h: 5,
    minW: 2,
    minH: 4,
    render: (c) => <GoldCalculatorWidget {...c} />,
  },
  tradingView: {
    type: 'tradingView',
    title: 'Live Chart',
    category: 'Charts',
    w: 6,
    h: 7,
    minW: 4,
    minH: 5,
    render: (c) => <TradingViewWidget {...c} />,
  },
  news: {
    type: 'news',
    title: 'Gold News',
    category: 'News',
    w: 4,
    h: 6,
    minW: 3,
    minH: 4,
    render: (c) => <NewsWidget {...c} />,
  },
  newsSentiment: {
    type: 'newsSentiment',
    title: 'News Sentiment',
    category: 'Sentiment',
    w: 3,
    h: 4,
    minW: 2,
    minH: 3,
    render: (c) => <NewsSentimentWidget {...c} />,
  },
  realYield: {
    type: 'realYield',
    title: '10Y Real Yield',
    category: 'Macro',
    w: 3,
    h: 5,
    minW: 2,
    minH: 4,
    render: (c) => <RealYieldWidget {...c} />,
  },
  macroRegime: {
    type: 'macroRegime',
    title: 'Macro Regime',
    category: 'Macro',
    w: 3,
    h: 4,
    minW: 2,
    minH: 3,
    render: (c) => <MacroRegimeWidget {...c} />,
  },
}

export const WIDGET_LIST = Object.values(WIDGETS)
