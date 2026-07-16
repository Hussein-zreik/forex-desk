import { LegalPage } from './LegalPage'

const SECTIONS = [
  {
    heading: '1. The service',
    body: [
      'Forex Desk is a market-information dashboard and trade-journaling tool. It aggregates publicly available market data, computes indicative signals, and stores the notes, journal entries, portfolio records and layouts you choose to save.',
      'The service is provided "as is" and "as available", without warranty of any kind. We may change, suspend or discontinue any part of it at any time.',
    ],
  },
  {
    heading: '2. Not financial advice',
    body: [
      'Nothing in Forex Desk — prices, news, sentiment, the composite bias, or any other signal — constitutes investment advice, a recommendation, or an offer to buy or sell any instrument. Signals are statistical indications derived from public data and can be wrong.',
      'You are solely responsible for your trading decisions. Trading foreign exchange, metals and derivatives involves substantial risk of loss and is not suitable for everyone.',
    ],
  },
  {
    heading: '3. Your account',
    body: [
      'You are responsible for keeping your credentials secure and for all activity under your account. You must provide a valid email address to use account-recovery features.',
      'We may suspend accounts that abuse the service (e.g. scraping, attempting to disrupt data providers, or violating applicable law).',
    ],
  },
  {
    heading: '4. Your content',
    body: [
      'Journal entries, notes, portfolio records and layouts remain yours. We store them only to provide the service to you and do not sell them. You can export your journal at any time and delete entries whenever you wish.',
    ],
  },
  {
    heading: '5. Market data',
    body: [
      'Quotes, news and macro series come from third-party sources and may be delayed, incomplete or inaccurate. Availability of any specific data source is not guaranteed.',
    ],
  },
  {
    heading: '6. Liability',
    body: [
      'To the maximum extent permitted by law, Forex Desk and its contributors are not liable for any losses — including trading losses — arising from the use of, or inability to use, the service or its data.',
    ],
  },
  {
    heading: '7. Changes',
    body: [
      'We may update these terms; material changes will be reflected by the “last updated” date above. Continuing to use the service after a change means you accept the updated terms.',
    ],
  },
]

export default function Terms() {
  return (
    <LegalPage
      title="Terms of Service"
      updated="2026-07-16"
      intro="By creating an account or using Forex Desk you agree to these terms. Please also read the Risk Disclaimer — it is part of this agreement."
      sections={SECTIONS}
    />
  )
}
