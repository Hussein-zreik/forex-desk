import { useCallback, useEffect, useRef, useState } from 'react'
import { useRefresh } from '@/store/useRefresh'

interface Options {
  pollMs?: number
  enabled?: boolean
}

interface Result<T> {
  data: T | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

/** Generic fetch/poll hook with loading + error state and manual refresh. */
export function useWidgetData<T>(
  fetcher: () => Promise<T>,
  deps: unknown[] = [],
  opts: Options = {},
): Result<T> {
  const { pollMs, enabled = true } = opts
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetcherRef = useRef(fetcher)
  useEffect(() => {
    fetcherRef.current = fetcher
  })

  // Global "refresh all" signal.
  const nonce = useRefresh((s) => s.nonce)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setData(await fetcherRef.current())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!enabled) return
    let active = true
    // Intentional fetch-on-mount; refresh() owns its loading/error state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh()
    let id: ReturnType<typeof setInterval> | undefined
    if (pollMs) {
      id = setInterval(() => {
        if (active) void refresh()
      }, pollMs)
    }
    return () => {
      active = false
      if (id) clearInterval(id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refresh, pollMs, enabled, nonce, ...deps])

  return { data, loading, error, refresh }
}
