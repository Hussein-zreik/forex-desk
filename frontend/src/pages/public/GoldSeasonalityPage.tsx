import { SeasonalityWidget } from '@/pages/Dashboard/widgets/SeasonalityWidget'
import { PublicWidgetPage } from './PublicWidgetPage'

export default function GoldSeasonalityPage() {
  return (
    <PublicWidgetPage
      path="/gold-seasonality"
      heading="Gold Seasonality"
      intro={[
        'Gold has a well-documented seasonal rhythm: festival and wedding demand from India and China tends to lift the autumn and winter months, while early summer is historically the weakest stretch. Seasonality is a tendency, not a signal — but it tells you when the wind is usually at your back.',
        'The chart shows average monthly gold returns; green months have historically closed higher more often than not.',
      ]}
    >
      <SeasonalityWidget />
    </PublicWidgetPage>
  )
}
