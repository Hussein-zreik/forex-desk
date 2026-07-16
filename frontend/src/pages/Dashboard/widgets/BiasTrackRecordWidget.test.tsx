import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { BiasTrackRecordWidget } from './BiasTrackRecordWidget'

vi.mock('@/lib/api', () => ({ api: vi.fn() }))
import { api } from '@/lib/api'

const mockedApi = vi.mocked(api)

function mockData(h1d: object, h1w: object, snapshots = 100) {
  mockedApi.mockImplementation((url: string) => {
    if (url.includes('/stats')) {
      return Promise.resolve({ symbol: 'XAU=F', snapshots, h1d, h1w })
    }
    return Promise.resolve({
      points: Array.from({ length: 10 }, (_, i) => ({ bucket: `b${i}`, score: i * 10 - 50 })),
    })
  })
}

const wrap = () =>
  render(
    <MemoryRouter>
      <BiasTrackRecordWidget />
    </MemoryRouter>,
  )

describe('BiasTrackRecordWidget', () => {
  beforeEach(() => {
    // Braces matter: mockReset() returns the mock, and a function returned
    // from a hook is treated by vitest as a teardown callback.
    mockedApi.mockReset()
  })

  it('shows hit rates with sample sizes once n >= 20', async () => {
    mockData(
      { correct: 30, wrong: 15, n: 45, hit_rate: 66.7 },
      { correct: 10, wrong: 12, n: 22, hit_rate: 45.5 },
    )
    wrap()
    expect(await screen.findByText(/66\.7%/)).toBeInTheDocument()
    expect(screen.getByText(/45\.5%/)).toBeInTheDocument()
    expect(screen.getByText(/\(n=45\)/)).toBeInTheDocument()
  })

  it('hides percentages behind a collecting-data state when n < 20', async () => {
    mockData(
      { correct: 3, wrong: 2, n: 5, hit_rate: 60.0 },
      { correct: 0, wrong: 0, n: 0, hit_rate: null },
    )
    wrap()
    expect(await screen.findByText(/collecting data — 5\/20/)).toBeInTheDocument()
    expect(screen.getByText(/collecting data — 0\/20/)).toBeInTheDocument()
    expect(screen.queryByText(/60/)).not.toBeInTheDocument()
  })

  it('always carries the not-investment-advice caption', async () => {
    mockData(
      { correct: 30, wrong: 15, n: 45, hit_rate: 66.7 },
      { correct: 0, wrong: 0, n: 0, hit_rate: null },
    )
    wrap()
    expect(await screen.findByText(/not investment advice/i)).toBeInTheDocument()
  })

  it('shows the warm-up empty state before any snapshots exist', async () => {
    mockData(
      { correct: 0, wrong: 0, n: 0, hit_rate: null },
      { correct: 0, wrong: 0, n: 0, hit_rate: null },
      0,
    )
    wrap()
    expect(await screen.findByText(/no snapshots yet/i)).toBeInTheDocument()
  })
})
