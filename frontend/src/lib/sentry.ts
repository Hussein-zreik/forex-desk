/**
 * Error tracking — strictly opt-in via VITE_SENTRY_DSN (build-time).
 * Dynamically imported so builds without a DSN ship zero Sentry bytes on the
 * critical path; the SDK loads as its own lazy chunk only when configured.
 */
import { useSettings } from '@/store/useSettings'

export function initSentry(): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined
  if (!dsn) return
  // User privacy setting (Settings → Privacy & Security). The persisted store
  // hydrates synchronously from localStorage, so this is safe pre-render.
  if (!useSettings.getState().shareErrorReports) return
  void import('@sentry/react')
    .then((Sentry) =>
      Sentry.init({
        dsn,
        environment: import.meta.env.MODE,
        sendDefaultPii: false,
        tracesSampleRate: 0.1,
      }),
    )
    .catch(() => {
      // Telemetry must never break the app.
    })
}
