import { COTWidget } from '@/pages/Dashboard/widgets/COTWidget'
import { PublicWidgetPage } from './PublicWidgetPage'

export default function CotPage() {
  return (
    <PublicWidgetPage
      path="/cot"
      heading="COT Report — Gold Futures Positioning"
      intro={[
        'The Commitments of Traders report shows how large speculators, commercials and small traders are positioned in gold futures — published weekly by the CFTC. Extreme net-long or net-short readings often precede reversals, which makes COT one of the few genuinely forward-looking datasets in this market.',
        'The chart below tracks net speculative positioning in COMEX gold, straight from the CFTC release.',
      ]}
    >
      <COTWidget symbol="XAU=F" title="Gold — COT net positioning" />
    </PublicWidgetPage>
  )
}
