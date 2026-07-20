/**
 * Cookieless, privacy-friendly analytics — strictly opt-in and zero-cost when
 * unconfigured. Compatible with Plausible / Umami and any provider that loads
 * via a single deferred <script> tag.
 *
 * Enable by setting at build time:
 *   VITE_ANALYTICS_SRC          the provider script URL (required to activate)
 *   VITE_ANALYTICS_DOMAIN       optional — Plausible `data-domain`
 *   VITE_ANALYTICS_WEBSITE_ID   optional — Umami `data-website-id`
 *
 * When VITE_ANALYTICS_SRC is unset the app ships no analytics code path at all.
 * We also honour Do Not Track and never inject twice.
 */

const MARKER = 'data-fxdesk-analytics'

function doNotTrack(): boolean {
  if (typeof navigator === 'undefined') return false
  const nav = navigator as Navigator & { msDoNotTrack?: string }
  const win = window as Window & { doNotTrack?: string }
  const signal = nav.doNotTrack ?? win.doNotTrack ?? nav.msDoNotTrack
  return signal === '1' || signal === 'yes'
}

export function initAnalytics(): void {
  const src = import.meta.env.VITE_ANALYTICS_SRC as string | undefined
  if (!src) return // not configured — nothing to load
  if (typeof document === 'undefined') return
  if (doNotTrack()) return // respect the user's browser preference
  if (document.querySelector(`script[${MARKER}]`)) return // already injected

  const domain = import.meta.env.VITE_ANALYTICS_DOMAIN as string | undefined
  const websiteId = import.meta.env.VITE_ANALYTICS_WEBSITE_ID as string | undefined

  const script = document.createElement('script')
  script.defer = true
  script.src = src
  script.setAttribute(MARKER, '')
  if (domain) script.setAttribute('data-domain', domain)
  if (websiteId) script.setAttribute('data-website-id', websiteId)
  document.head.appendChild(script)
}
