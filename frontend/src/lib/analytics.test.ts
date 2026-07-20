import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { initAnalytics } from './analytics'

const SEL = 'script[data-fxdesk-analytics]'

describe('initAnalytics', () => {
  beforeEach(() => {
    document.head.querySelectorAll(SEL).forEach((el) => el.remove())
  })
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it('injects nothing when VITE_ANALYTICS_SRC is unset', () => {
    initAnalytics()
    expect(document.querySelector(SEL)).toBeNull()
  })

  it('injects a deferred script with data attrs when configured', () => {
    vi.stubEnv('VITE_ANALYTICS_SRC', 'https://plausible.io/js/script.js')
    vi.stubEnv('VITE_ANALYTICS_DOMAIN', 'forexdesk.app')
    vi.stubGlobal('navigator', { doNotTrack: '0' })

    initAnalytics()

    const el = document.querySelector(SEL) as HTMLScriptElement | null
    expect(el).not.toBeNull()
    expect(el!.src).toBe('https://plausible.io/js/script.js')
    expect(el!.defer).toBe(true)
    expect(el!.getAttribute('data-domain')).toBe('forexdesk.app')
  })

  it('respects Do Not Track', () => {
    vi.stubEnv('VITE_ANALYTICS_SRC', 'https://plausible.io/js/script.js')
    vi.stubGlobal('navigator', { doNotTrack: '1' })

    initAnalytics()
    expect(document.querySelector(SEL)).toBeNull()
  })

  it('never injects twice', () => {
    vi.stubEnv('VITE_ANALYTICS_SRC', 'https://plausible.io/js/script.js')
    vi.stubGlobal('navigator', { doNotTrack: '0' })

    initAnalytics()
    initAnalytics()
    expect(document.querySelectorAll(SEL)).toHaveLength(1)
  })
})
