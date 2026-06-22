export type Level = 'Beginner' | 'Intermediate' | 'Advanced'

export interface LessonSection {
  heading: string
  body: string[]
}

export interface Lesson {
  id: string
  title: string
  category: string
  level: Level
  readMins: number
  summary: string
  sections: LessonSection[]
  takeaways: string[]
}

export interface GlossaryTerm {
  term: string
  def: string
}

export const CATEGORIES = [
  'Foundations',
  'Technical Analysis',
  'Smart Money',
  'Risk Management',
  'Psychology',
  'Gold & Macro',
] as const

export const LESSONS: Lesson[] = [
  {
    id: 'what-is-forex',
    title: 'What the Forex Market Actually Is',
    category: 'Foundations',
    level: 'Beginner',
    readMins: 6,
    summary:
      'How the largest market on earth works: currency pairs, quotes, pips, lots, and what you are really trading when you click buy.',
    sections: [
      {
        heading: 'A market of relative value',
        body: [
          'Forex (FX) is the global market for exchanging one currency for another. Unlike a stock, a currency has no value in isolation — it is always priced against another currency. That is why everything trades in pairs, such as EUR/USD or XAU/USD (gold against the dollar).',
          'The first currency in a pair is the base; the second is the quote. A EUR/USD price of 1.0850 means one euro buys 1.0850 US dollars. When you "buy EUR/USD" you are simultaneously long euros and short dollars — a bet that the euro will strengthen relative to the dollar.',
        ],
      },
      {
        heading: 'Pips, lots and position size',
        body: [
          'A pip is the standard smallest increment for most pairs: the fourth decimal place (0.0001). For JPY pairs it is the second decimal. Gold is usually quoted to the cent, and a "pip" there is loosely one dollar of price movement.',
          'Volume is measured in lots. A standard lot is 100,000 units of the base currency; a mini lot is 10,000; a micro lot is 1,000. Your profit or loss per pip scales with lot size, which is the lever you actually control when managing risk.',
        ],
      },
      {
        heading: 'Who moves the price',
        body: [
          'The FX market is decentralised — there is no single exchange. Banks, hedge funds, corporations hedging trade flows, central banks, and retail traders all transact through a web of liquidity providers. The "interbank" market sits at the top of this hierarchy and sets the reference price your broker quotes you.',
          'Because participants span every timezone, FX runs 24 hours a day across the Sydney, Tokyo, London and New York sessions, closing only over the weekend.',
        ],
      },
    ],
    takeaways: [
      'You always trade one currency against another — never in isolation.',
      'A pip is the unit of price movement; a lot is the unit of size.',
      'Position size, not the pip move, is what you directly control.',
    ],
  },
  {
    id: 'sessions-liquidity',
    title: 'Sessions, Liquidity and When to Trade',
    category: 'Foundations',
    level: 'Beginner',
    readMins: 5,
    summary:
      'Why the London–New York overlap matters, how liquidity shapes spreads and volatility, and when the market actually moves.',
    sections: [
      {
        heading: 'The four sessions',
        body: [
          'The trading day rotates through Sydney, Tokyo, London and New York. Each region brings its own flows: the Asian session is typically quieter and range-bound, while London opens with a surge of volume that often sets the day’s direction.',
          'The highest-liquidity window is the London–New York overlap (roughly 13:00–16:00 UTC). Tight spreads and strong participation make it the preferred window for many intraday traders.',
        ],
      },
      {
        heading: 'Liquidity, spread and slippage',
        body: [
          'Liquidity is simply how many willing buyers and sellers are present. High liquidity means tighter spreads (the gap between bid and ask) and less slippage when you enter. Thin liquidity — the Asian session, rollover at 22:00 UTC, or right before major news — widens spreads and makes fills unpredictable.',
          'The dashboard’s Trading Sessions and Session Heatmap widgets visualise which markets are open and which hours have historically produced the most movement for your instrument.',
        ],
      },
    ],
    takeaways: [
      'The London–New York overlap offers the deepest liquidity of the day.',
      'Tighter spreads and cleaner fills come with higher liquidity.',
      'Avoid thin windows (rollover, pre-news) unless you have a specific reason.',
    ],
  },
  {
    id: 'support-resistance',
    title: 'Support, Resistance and Market Structure',
    category: 'Technical Analysis',
    level: 'Beginner',
    readMins: 7,
    summary:
      'The backbone of price analysis: how to read swing highs and lows, trends, and the levels where order flow concentrates.',
    sections: [
      {
        heading: 'Structure is a sequence of swings',
        body: [
          'Markets move in swings — alternating highs and lows. An uptrend is a staircase of higher highs and higher lows; a downtrend is lower highs and lower lows. When that sequence breaks (for example, price makes a lower low after a run of higher lows), structure has shifted and the prevailing trend is in question.',
          'Reading structure first prevents the most common beginner mistake: buying into a clear downtrend because an indicator looked oversold.',
        ],
      },
      {
        heading: 'Support and resistance as zones',
        body: [
          'Support is a price area where buying has previously overwhelmed selling; resistance is where selling overwhelmed buying. Treat them as zones, not exact lines — liquidity clusters around round numbers and prior swing points rather than at a single precise price.',
          'A level that breaks often flips role: old resistance becomes new support and vice versa. This "polarity" is one of the most reliable patterns in price action.',
        ],
      },
      {
        heading: 'Confluence beats any single line',
        body: [
          'A level is only as strong as the reasons stacked behind it. When a horizontal level lines up with a pivot point, a round number, and a higher-timeframe swing, you have confluence — and confluence is what turns a line on a chart into a decision worth risking money on.',
        ],
      },
    ],
    takeaways: [
      'Identify the trend from the sequence of highs and lows before anything else.',
      'Treat support and resistance as zones; expect broken levels to flip role.',
      'Trade where multiple independent signals overlap — confluence.',
    ],
  },
  {
    id: 'indicators-vs-price',
    title: 'Indicators Without the Noise',
    category: 'Technical Analysis',
    level: 'Intermediate',
    readMins: 6,
    summary:
      'What RSI, moving averages and ATR actually measure, and how to use them as context rather than as buy/sell buttons.',
    sections: [
      {
        heading: 'Indicators are derived, not leading',
        body: [
          'Every indicator is a mathematical transform of price (and sometimes volume). It cannot know more than price already does — it repackages the same data to make one quality easier to see. Use them to answer a specific question, not to generate signals in a vacuum.',
          'Moving averages summarise trend direction and dynamic support. RSI measures momentum and stretch. ATR measures volatility, which is the right tool for sizing stops, not for predicting direction.',
        ],
      },
      {
        heading: 'Momentum and the RSI trap',
        body: [
          'RSI above 70 ("overbought") or below 30 ("oversold") does not mean reverse. In a strong trend, RSI can stay pinned for a long time — selling every overbought reading in a bull run is a fast way to lose. RSI is most useful for spotting divergence (price makes a new high, momentum does not) as an early warning, confirmed by structure.',
        ],
      },
      {
        heading: 'Volatility sizing with ATR',
        body: [
          'Average True Range tells you how far an instrument typically moves in a period. Placing a stop a fixed number of pips away ignores conditions; placing it a multiple of ATR away adapts to the market. The Volatility Range widget on your dashboard uses ATR to project a realistic daily band around price.',
        ],
      },
    ],
    takeaways: [
      'Indicators reprocess price — they are context, not crystal balls.',
      'Overbought/oversold is not a signal; divergence plus structure is.',
      'Use ATR to size stops to current volatility, not a fixed pip count.',
    ],
  },
  {
    id: 'smc-basics',
    title: 'Smart Money Concepts: Structure, Liquidity, FVG',
    category: 'Smart Money',
    level: 'Advanced',
    readMins: 8,
    summary:
      'Break of structure, order blocks, fair-value gaps and liquidity sweeps — the institutional lens behind the SMC widget.',
    sections: [
      {
        heading: 'Break of Structure vs Change of Character',
        body: [
          'Smart Money Concepts (SMC) frames the chart as a record of where large players accumulate and distribute positions. A Break of Structure (BOS) is price continuing the trend by taking out the prior swing in the trend’s direction. A Change of Character (CHoCH) is the first break against the trend — an early hint that order flow is shifting.',
          'The dashboard SMC widget labels the most recent decisive move as BOS up or down so you can read the prevailing intent at a glance.',
        ],
      },
      {
        heading: 'Liquidity and the sweep',
        body: [
          'Stops cluster in predictable places — just beyond obvious swing highs and lows, and around round numbers. SMC treats these pools as liquidity that institutions target. A "sweep" is a sharp wick through such a level that triggers those stops and then reverses, filling large orders against the trapped traders.',
          'Recognising a sweep keeps you from chasing the breakout that was engineered to fail.',
        ],
      },
      {
        heading: 'Fair-value gaps and order blocks',
        body: [
          'A Fair-Value Gap (FVG) is an imbalance — a three-candle pattern where price moved so fast it left an untraded gap. Markets often return to "rebalance" these zones, making them high-probability areas to look for entries. An order block is the last opposing candle before a strong move, marking where institutional orders likely originated.',
          'SMC is powerful but easy to over-fit. Use it to locate where you would expect a reaction, then demand confirmation from structure before committing.',
        ],
      },
    ],
    takeaways: [
      'BOS confirms the trend; CHoCH is the first warning it may be ending.',
      'Liquidity sweeps trap breakout traders just beyond obvious levels.',
      'FVGs and order blocks mark zones to watch — still wait for confirmation.',
    ],
  },
  {
    id: 'risk-position-sizing',
    title: 'Risk First: Position Sizing That Survives',
    category: 'Risk Management',
    level: 'Beginner',
    readMins: 7,
    summary:
      'The single most important skill: fixing your risk per trade, sizing from your stop, and why the math of drawdown is brutal.',
    sections: [
      {
        heading: 'Risk a fixed fraction',
        body: [
          'Professionals decide how much they are willing to lose before they think about how much they might make. A common rule is to risk no more than 1–2% of account equity on any single trade. This keeps any one loss survivable and removes the emotional weight of a single outcome.',
          'Crucially, your position size is an output, not an input. You choose your entry and your stop; the distance between them plus your risk budget determines the lot size. Never size first and place the stop to fit.',
        ],
      },
      {
        heading: 'The arithmetic of drawdown',
        body: [
          'Losses and recoveries are not symmetric. A 10% drawdown needs an 11% gain to recover; a 50% drawdown needs a 100% gain. This asymmetry is why capital preservation outranks profit-seeking — staying small through a losing streak is what lets you still be in the game when your edge reasserts.',
        ],
      },
      {
        heading: 'Reward-to-risk and expectancy',
        body: [
          'You do not need to be right often to be profitable. With a 2:1 reward-to-risk ratio, a 40% win rate is profitable over time. Expectancy — average win times win-rate minus average loss times loss-rate — is the number that actually matters, and the Journal page is where you measure it from your own trades.',
        ],
      },
    ],
    takeaways: [
      'Fix risk per trade (1–2%) before anything else; size from the stop.',
      'Drawdowns compound against you — a 50% loss needs a 100% gain back.',
      'A positive-expectancy system can win less than half its trades.',
    ],
  },
  {
    id: 'stops-and-exits',
    title: 'Stops, Targets and the Art of the Exit',
    category: 'Risk Management',
    level: 'Intermediate',
    readMins: 6,
    summary:
      'Where to place a stop so it protects without strangling, how to set targets at real levels, and managing the trade once you are in.',
    sections: [
      {
        heading: 'Place stops at invalidation, not at comfort',
        body: [
          'A stop belongs at the price that proves your idea wrong — beyond the swing or structure your trade depends on — not at an arbitrary pip distance that simply feels affordable. If the correct invalidation is too far for your risk budget, the answer is a smaller position, not a tighter stop.',
          'Adding ATR padding beyond the level helps you survive the normal noise and the liquidity sweeps that target obvious stop placements.',
        ],
      },
      {
        heading: 'Targets at liquidity',
        body: [
          'Set targets where opposing liquidity sits: prior swing highs/lows, pivots, round numbers, or the edge of an ATR-projected range. Banking partial profit at the first such level and trailing the remainder is a robust way to capture trends without giving everything back.',
        ],
      },
    ],
    takeaways: [
      'Stop placement is defined by invalidation, then sized into your risk.',
      'Pad stops beyond obvious levels to avoid being swept.',
      'Target real liquidity; scale out and trail to let winners run.',
    ],
  },
  {
    id: 'trading-psychology',
    title: 'The Inner Game: Discipline Over Prediction',
    category: 'Psychology',
    level: 'Intermediate',
    readMins: 6,
    summary:
      'Why execution, not analysis, separates profitable traders — and the habits that keep emotion from hijacking a good plan.',
    sections: [
      {
        heading: 'You are managing yourself, not the market',
        body: [
          'Most blown accounts are not the result of bad analysis but of broken rules: moving a stop, doubling down to "get it back", or abandoning a plan after two losses. The market is probabilistic, and any single trade is essentially random around your edge. Internalising that randomness is what lets you take a loss without flinching.',
          'Treat trading as the repeated execution of a positive-expectancy process. Judge yourself on whether you followed the process, not on whether a given trade won.',
        ],
      },
      {
        heading: 'Tilt, revenge and overtrading',
        body: [
          'Tilt is emotional decision-making after a loss or a missed move. Its signatures are oversized positions, trades outside your plan, and a need to be in the market. The defence is mechanical: a maximum daily loss that ends your session, a checklist before every entry, and a journal that makes patterns of self-sabotage impossible to ignore.',
        ],
      },
    ],
    takeaways: [
      'Score yourself on process adherence, not individual outcomes.',
      'Any single trade is random around your edge — expect losers.',
      'Use hard rules (daily loss cap, entry checklist) to disarm tilt.',
    ],
  },
  {
    id: 'gold-drivers',
    title: 'What Actually Moves Gold',
    category: 'Gold & Macro',
    level: 'Intermediate',
    readMins: 7,
    summary:
      'Real yields, the dollar, risk sentiment and central-bank demand — the macro forces behind every XAU/USD candle.',
    sections: [
      {
        heading: 'Real yields are the primary driver',
        body: [
          'Gold pays no interest, so its biggest competitor is the real (inflation-adjusted) yield on US Treasuries. When real yields fall, the opportunity cost of holding gold drops and gold tends to rise; when real yields climb, gold faces a headwind. The 10Y Real Yield widget tracks exactly this relationship.',
          'This is why gold can fall even as inflation rises — what matters is the yield net of inflation, not the headline inflation number alone.',
        ],
      },
      {
        heading: 'The dollar and risk sentiment',
        body: [
          'Gold is priced in dollars, so a stronger dollar (rising DXY) generally pressures gold, and a weaker dollar supports it — though the link is not mechanical. Gold also carries a safe-haven bid: in risk-off episodes, capital can flow into both gold and the dollar at once, which is why the Macro Regime widget pairs VIX with real yields to read the environment.',
        ],
      },
      {
        heading: 'Structural demand',
        body: [
          'Beyond the daily macro tug-of-war, central-bank buying and physical/ETF demand provide a slower structural current. Sustained official-sector accumulation can keep a floor under price even when short-term yield moves argue otherwise. The Gold ETF Flow widget hints at the investment-demand side of this picture.',
        ],
      },
    ],
    takeaways: [
      'Falling real yields are gold’s strongest tailwind; rising yields, its headwind.',
      'A stronger dollar usually pressures gold, but safe-haven flows can override it.',
      'Central-bank and ETF demand set the slower structural backdrop.',
    ],
  },
  {
    id: 'economic-calendar',
    title: 'Trading the Economic Calendar',
    category: 'Gold & Macro',
    level: 'Intermediate',
    readMins: 6,
    summary:
      'How high-impact releases like NFP, CPI and rate decisions move FX and gold — and how to manage risk around them.',
    sections: [
      {
        heading: 'It is the surprise that moves price',
        body: [
          'Markets price in expectations ahead of a release. What moves price is the deviation from the forecast — the surprise — not the absolute number. A strong jobs report can sink a currency if the market expected something even stronger. Always read the actual against the consensus, which is exactly what the Calendar and Eco Surprises widgets surface.',
        ],
      },
      {
        heading: 'The heavyweight releases',
        body: [
          'For the dollar and gold, the events that reliably generate volatility are central-bank rate decisions and their guidance, inflation prints (CPI/PCE), and US labour data (Non-Farm Payrolls). Around these, spreads widen, liquidity thins for a moment, and price can gap.',
        ],
      },
      {
        heading: 'Managing event risk',
        body: [
          'You have two honest choices: be flat into the release and trade the clean move afterwards, or hold a pre-planned position with risk you have explicitly accepted could gap through your stop. Sizing down and avoiding fresh entries in the seconds around the print keeps event volatility from turning a good week into a bad one.',
        ],
      },
    ],
    takeaways: [
      'Price reacts to the surprise versus consensus, not the raw figure.',
      'Rate decisions, CPI and NFP are the highest-impact recurring events.',
      'Either be flat into news or accept genuine gap risk — do not pretend a stop guarantees your exit.',
    ],
  },
]

export const GLOSSARY: GlossaryTerm[] = [
  {
    term: 'Pip',
    def: 'The standard smallest price increment — 0.0001 for most pairs, 0.01 for JPY pairs.',
  },
  {
    term: 'Spread',
    def: 'The difference between the bid and ask price; your immediate cost of entering a trade.',
  },
  {
    term: 'Lot',
    def: 'A unit of trade size. Standard = 100,000 base units, mini = 10,000, micro = 1,000.',
  },
  {
    term: 'Leverage',
    def: 'Borrowed exposure that lets you control a larger position than your margin; it magnifies both gains and losses.',
  },
  {
    term: 'Pivot Point',
    def: 'A calculated reference level (from the prior high, low and close) used to frame intraday support and resistance.',
  },
  {
    term: 'ATR',
    def: 'Average True Range — a measure of recent volatility, useful for sizing stops to current conditions.',
  },
  {
    term: 'RSI',
    def: 'Relative Strength Index — a 0–100 momentum oscillator; most valuable for spotting divergence.',
  },
  {
    term: 'BOS',
    def: 'Break of Structure — price continuing a trend by taking out the previous swing point in its direction.',
  },
  {
    term: 'CHoCH',
    def: 'Change of Character — the first structural break against the prevailing trend; an early reversal hint.',
  },
  {
    term: 'FVG',
    def: 'Fair-Value Gap — a price imbalance left by a fast move that the market often returns to rebalance.',
  },
  {
    term: 'Liquidity Sweep',
    def: 'A sharp move through an obvious level to trigger clustered stops before reversing.',
  },
  {
    term: 'Real Yield',
    def: 'The inflation-adjusted return on a bond; the dominant macro driver of gold.',
  },
  {
    term: 'DXY',
    def: 'The US Dollar Index — the dollar measured against a basket of major currencies.',
  },
  {
    term: 'Drawdown',
    def: 'The peak-to-trough decline in account equity; recovering one requires a larger percentage gain.',
  },
  {
    term: 'Expectancy',
    def: 'The average amount you can expect to win or lose per trade given your win rate and reward-to-risk.',
  },
  {
    term: 'Slippage',
    def: 'The difference between the expected fill price and the actual fill, common in thin or fast markets.',
  },
]
