import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/api', () => ({
  api: vi.fn(),
}))
import { api } from '@/lib/api'
import { TICKER_SYMBOLS } from '@/lib/symbols'
import { useWatchlist } from './useWatchlist'

const mockedApi = vi.mocked(api)

const CATALOG = [
  { symbol: 'XAU=F', label: 'XAU/USD' },
  { symbol: 'EURUSD=X', label: 'EUR/USD' },
  { symbol: '^GSPC', label: 'S&P 500' },
]

describe('useWatchlist', () => {
  beforeEach(() => {
    mockedApi.mockReset()
    useWatchlist.setState({ symbols: [...TICKER_SYMBOLS], catalog: [], loaded: false })
  })

  it('loads the server watchlist once', async () => {
    mockedApi.mockResolvedValueOnce({ symbols: ['XAU=F', '^GSPC'], catalog: CATALOG })
    await useWatchlist.getState().load()
    expect(useWatchlist.getState().symbols).toEqual(['XAU=F', '^GSPC'])
    expect(useWatchlist.getState().catalog).toHaveLength(3)

    await useWatchlist.getState().load() // second call is a no-op
    expect(mockedApi).toHaveBeenCalledTimes(1)
  })

  it('keeps defaults when the fetch fails (logged out)', async () => {
    mockedApi.mockRejectedValueOnce(new Error('401'))
    await useWatchlist.getState().load()
    expect(useWatchlist.getState().symbols).toEqual([...TICKER_SYMBOLS])
    expect(useWatchlist.getState().loaded).toBe(false)
  })

  it('ignores a degraded payload instead of blanking the ticker', async () => {
    mockedApi.mockResolvedValueOnce({ error: 'unavailable' })
    await useWatchlist.getState().load()
    // Symbols stay a valid non-empty array — never undefined.
    expect(useWatchlist.getState().symbols).toEqual([...TICKER_SYMBOLS])
    expect(useWatchlist.getState().loaded).toBe(false)
  })

  it('saves optimistically and rolls back on failure', async () => {
    useWatchlist.setState({ symbols: ['XAU=F'], catalog: CATALOG, loaded: true })
    mockedApi.mockRejectedValueOnce(new Error('500'))
    await useWatchlist.getState().save(['XAU=F', 'EURUSD=X'])
    expect(useWatchlist.getState().symbols).toEqual(['XAU=F']) // rolled back

    mockedApi.mockResolvedValueOnce({ symbols: ['EURUSD=X'], catalog: CATALOG })
    await useWatchlist.getState().save(['EURUSD=X'])
    expect(useWatchlist.getState().symbols).toEqual(['EURUSD=X'])
  })
})
