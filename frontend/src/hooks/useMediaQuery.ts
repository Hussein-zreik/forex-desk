import { useEffect, useState } from 'react'

/**
 * Subscribe to a CSS media query. SSR/test-safe (defaults to `false` when
 * `matchMedia` is unavailable). Use for layout decisions that must render a single
 * tree rather than toggling visibility with `hidden`/`block`.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false
    return window.matchMedia(query).matches
  })

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mql = window.matchMedia(query)
    const onChange = () => setMatches(mql.matches)
    onChange()
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [query])

  return matches
}
