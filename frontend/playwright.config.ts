import { defineConfig, devices } from '@playwright/test'

// Local dev containers ship a prebuilt browser; point Playwright at it when set.
// CI installs its own via `npx playwright install chromium`.
const executablePath = process.env.PW_CHROMIUM || undefined

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: 'line',
  use: {
    baseURL: 'http://localhost:4173',
    // The PWA service worker (workbox) would intercept /api/* and bypass route
    // mocks; block it so the in-test API mocks apply.
    serviceWorkers: 'block',
    ...(executablePath ? { launchOptions: { executablePath } } : {}),
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    // Build same-origin (empty API base ⇒ relative /api) so the in-test route
    // mocks intercept cleanly with no cross-origin CORS preflight.
    command: "VITE_API_URL='' npm run build && npm run preview -- --port 4173 --strictPort",
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
})
