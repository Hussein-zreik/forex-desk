import { render, screen } from '@testing-library/react'
import App from './App'

test('renders the Forex Desk brand label', () => {
  render(<App />)
  expect(screen.getByText('Forex Desk')).toBeInTheDocument()
})

test('renders the foundation headline', () => {
  render(<App />)
  expect(screen.getByRole('heading', { name: /foundations/i })).toBeInTheDocument()
})
