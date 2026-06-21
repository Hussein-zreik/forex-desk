import { render, screen } from '@testing-library/react'
import type { Quote } from '@/store/useMarketData'
import { TickerStrip } from './TickerWidget'

const quotes: Quote[] = [
  { symbol: 'EURUSD=X', price: 1.085, change: 0.002, changePercent: 0.18 },
  { symbol: 'XAU=F', price: 2350.5, change: -5.5, changePercent: -0.23 },
]

test('renders symbol labels and percent change', () => {
  render(<TickerStrip quotes={quotes} />)
  expect(screen.getAllByText('EUR/USD').length).toBeGreaterThan(0)
  expect(screen.getAllByText('XAU/USD').length).toBeGreaterThan(0)
  expect(screen.getAllByText(/0\.18%/).length).toBeGreaterThan(0)
})

test('shows a connecting state when there are no quotes', () => {
  render(<TickerStrip quotes={[]} />)
  expect(screen.getByText(/connecting to live market data/i)).toBeInTheDocument()
})
