import { EconomicCalendarWidget } from '@/pages/Dashboard/widgets/EconomicCalendarWidget'
import { PublicWidgetPage } from './PublicWidgetPage'

export default function EconomicCalendarPage() {
  return (
    <PublicWidgetPage
      path="/economic-calendar"
      heading="Economic Calendar"
      intro={[
        'This week’s economic releases with impact ratings, forecasts and previous prints — updated continuously from the weekly feed. Rate decisions, inflation prints and employment data are what actually move forex and gold; everything else is noise.',
        'High-impact events (FOMC, NFP, CPI) are flagged so you can size down or stand aside before the spike.',
      ]}
    >
      <EconomicCalendarWidget />
    </PublicWidgetPage>
  )
}
