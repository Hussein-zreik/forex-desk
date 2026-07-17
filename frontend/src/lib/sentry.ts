/**
 * Error tracking — strictly opt-in via VITE_SENTRY_DSN (build-time).
 * Dynamically imported so builds without a DSN ship zero Sentry bytes on the
 * critical path; the SDK loads as its own lazy chunk only when configured.
 */
export function initSentry(): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined
  if (!dsn) return
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
