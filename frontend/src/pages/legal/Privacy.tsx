import { LegalPage } from './LegalPage'

const SECTIONS = [
  {
    heading: '1. What we store',
    body: [
      'Account: your email address and a salted hash of your password (never the password itself), plus an email-verified flag.',
      'Your data: journal entries, portfolio positions, price alerts, dashboard layouts and theme preference — stored only so the product works for you.',
      'We do not run third-party analytics or advertising trackers, and we do not sell or share your data with advertisers.',
    ],
  },
  {
    heading: '2. What we send and where',
    body: [
      'Transactional email (verification, password reset) is delivered through the configured email provider. If you link Telegram for alerts, your chat id is stored so alerts can be delivered to you.',
      'Market data requests go from our server to public data providers; your personal data is not included in those requests.',
    ],
  },
  {
    heading: '3. Cookies & storage',
    body: [
      'The app keeps your session token and UI preferences in your browser storage. No cross-site tracking cookies are used.',
    ],
  },
  {
    heading: '4. Retention & deletion',
    body: [
      'Journal entries, positions and alerts can be deleted in the app at any time and are removed from the database. To delete your entire account and its data, contact the operator of the deployment you use.',
    ],
  },
  {
    heading: '5. Security',
    body: [
      'Passwords are hashed with bcrypt; account-recovery tokens are single-use, expiring, and stored only as digests. Transport is TLS on the hosted deployment.',
      'No system is perfectly secure — use a unique password for your account.',
    ],
  },
  {
    heading: '6. Changes',
    body: [
      'Material changes to this policy will be reflected by the “last updated” date above.',
    ],
  },
]

export default function Privacy() {
  return (
    <LegalPage
      title="Privacy Policy"
      updated="2026-07-16"
      intro="Forex Desk stores the minimum needed to run a trading desk you can log back into: your account, your journal, your layouts. This page explains exactly what that means."
      sections={SECTIONS}
    />
  )
}
