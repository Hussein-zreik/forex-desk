import { LegalPage } from './LegalPage'

const SECTIONS = [
  {
    heading: 'No investment advice',
    body: [
      'Everything shown in Forex Desk — live prices, news headlines, sentiment gauges, COT positioning, seasonality, the multi-timeframe matrix and the composite bias — is market information and statistical indication, not advice. No content here is a recommendation to buy, sell or hold any instrument, and none of it is tailored to your situation.',
    ],
  },
  {
    heading: 'Signals can be wrong',
    body: [
      'Indicative signals are computed from public data with simple, transparent rules. They have no guaranteed predictive power, can conflict with each other, and will sometimes be plainly wrong. Where the app shows a historical hit-rate, past performance does not guarantee future results.',
    ],
  },
  {
    heading: 'Trading risk',
    body: [
      'Foreign exchange, precious metals and derivatives are volatile, often leveraged markets. Leverage magnifies losses as well as gains; you can lose more than your initial deposit with some brokers. Never trade with money you cannot afford to lose, and consider seeking advice from a licensed financial adviser.',
    ],
  },
  {
    heading: 'Data quality',
    body: [
      'Prices and macro data come from third-party sources and may be delayed, estimated or occasionally incorrect. Always confirm critical figures with your broker before acting.',
    ],
  },
]

export default function RiskDisclaimer() {
  return (
    <LegalPage
      title="Risk Disclaimer"
      updated="2026-07-16"
      intro="Read this before using any number on this platform to make a decision."
      sections={SECTIONS}
    />
  )
}
