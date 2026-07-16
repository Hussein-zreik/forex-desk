import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { Footer } from '@/components/Footer'
import Privacy from './Privacy'
import RiskDisclaimer from './RiskDisclaimer'
import Terms from './Terms'

const wrap = (el: React.ReactElement) => render(<MemoryRouter>{el}</MemoryRouter>)

describe('legal pages', () => {
  it('renders the terms of service', () => {
    wrap(<Terms />)
    expect(screen.getByRole('heading', { name: /terms of service/i })).toBeInTheDocument()
    expect(screen.getByText(/not financial advice/i)).toBeInTheDocument()
  })

  it('renders the privacy policy', () => {
    wrap(<Privacy />)
    expect(screen.getByRole('heading', { name: /privacy policy/i })).toBeInTheDocument()
    expect(screen.getByText(/what we store/i)).toBeInTheDocument()
  })

  it('renders the risk disclaimer', () => {
    wrap(<RiskDisclaimer />)
    expect(screen.getByRole('heading', { name: /risk disclaimer/i })).toBeInTheDocument()
    expect(screen.getByText(/signals can be wrong/i)).toBeInTheDocument()
  })
})

describe('footer', () => {
  it('links to all three legal pages and carries the risk line', () => {
    wrap(<Footer />)
    expect(screen.getByRole('link', { name: /terms/i })).toHaveAttribute('href', '/terms')
    expect(screen.getByRole('link', { name: /privacy/i })).toHaveAttribute('href', '/privacy')
    expect(screen.getByRole('link', { name: /risk disclaimer/i })).toHaveAttribute(
      'href',
      '/disclaimer',
    )
    expect(screen.getByText(/not investment advice/i)).toBeInTheDocument()
  })
})
