import { expect, type Page, test } from '@playwright/test'

const j = (o: unknown) => ({
  status: 200,
  contentType: 'application/json',
  body: JSON.stringify(o),
})

const CATALOG = [
  { symbol: 'XAU=F', label: 'XAU/USD' },
  { symbol: 'EURUSD=X', label: 'EUR/USD' },
  { symbol: 'GBPUSD=X', label: 'GBP/USD' },
  { symbol: '^GSPC', label: 'S&P 500' },
  { symbol: 'BTC-USD', label: 'BTC/USD' },
]

/**
 * Baseline mocks. Registered FIRST so that per-test overrides added afterwards
 * win — Playwright uses the most-recently-registered matching route.
 * `watchlist` is mutated in place on PUT so the count reflects edits.
 */
function baseRoutes(page: Page, watchlist: string[], puts: string[][] = []) {
  return page.route('**/api/**', (route) => {
    const path = route.request().url().split('?')[0]
    if (path.endsWith('/api/auth/login')) return route.fulfill(j({ access_token: 'e2e-token' }))
    if (path.endsWith('/api/auth/me'))
      return route.fulfill(
        j({ id: '1', email: 'e2e@test.dev', theme: 'dark', email_verified: true, totp_enabled: false }),
      )
    if (path.endsWith('/api/watchlist')) {
      if (route.request().method() === 'PUT') {
        const body = route.request().postDataJSON() as { symbols: string[] }
        puts.push(body.symbols)
        watchlist.length = 0
        watchlist.push(...body.symbols)
      }
      return route.fulfill(j({ symbols: watchlist, catalog: CATALOG }))
    }
    if (path.endsWith('/api/telegram/status'))
      return route.fulfill(j({ configured: false, linked: false }))
    if (path.endsWith('/api/layout')) return route.fulfill(j({ widgets: [], layouts: {} }))
    if (path.endsWith('/api/journal')) return route.fulfill(j([]))
    if (path.endsWith('/api/quotes')) return route.fulfill(j({ quotes: [] }))
    return route.fulfill(j({ error: 'unavailable', articles: [], sentiment: {}, points: [] }))
  })
}

async function passwordStep(page: Page) {
  await page.goto('/login')
  await page.locator('input[type=email]').fill('e2e@test.dev')
  await page.locator('input[type=password]').fill('password123')
  await page.locator('button[type=submit]').click()
}

test('two-step TOTP login: password → code → dashboard', async ({ page }) => {
  await baseRoutes(page, ['XAU=F', 'EURUSD=X'])
  // Overrides registered after the base so they take precedence.
  await page.route('**/api/auth/login', (route) =>
    route.fulfill(j({ totp_required: true, challenge_token: 'chal-123' })),
  )
  const verifyBodies: unknown[] = []
  await page.route('**/api/auth/totp/verify', (route) => {
    verifyBodies.push(route.request().postDataJSON())
    return route.fulfill(j({ access_token: 'e2e-token' }))
  })

  await passwordStep(page)

  // The code step appears instead of navigating.
  await expect(page.getByRole('heading', { name: 'Two-factor code' })).toBeVisible()
  await expect(page).not.toHaveURL(/dashboard/)

  await page.getByLabel('Authentication code').fill('654321')
  await page.getByRole('button', { name: 'Verify' }).click()

  await page.waitForURL('**/dashboard')
  expect(verifyBodies).toEqual([{ challenge_token: 'chal-123', code: '654321' }])
})

test('options menu opens the settings sections and toggles theme', async ({ page }) => {
  await baseRoutes(page, ['XAU=F', 'EURUSD=X'])
  await passwordStep(page)
  await page.waitForURL('**/dashboard')

  await page.getByRole('button', { name: 'Options' }).click()
  await expect(page.getByRole('menu')).toBeVisible()
  for (const label of [
    'Account & Profile',
    'General',
    'Privacy & Security',
    'Notifications',
    'Help & Support',
  ]) {
    await expect(page.getByRole('menuitem', { name: label })).toBeVisible()
  }

  // Theme toggles from the menu (dark → light flips the root class).
  await page.getByRole('menuitem', { name: /Light mode/ }).click()
  await expect
    .poll(() => page.evaluate(() => document.documentElement.classList.contains('dark')))
    .toBe(false)

  // The menu stays open after a theme toggle, so navigate a section directly.
  await page.getByRole('menuitem', { name: 'Privacy & Security' }).click()
  await page.waitForURL('**/settings**')
  await expect(page.getByRole('heading', { name: 'Options' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Privacy & Security' })).toBeVisible()
})

test('watchlist editor toggles a symbol and persists via PUT', async ({ page }) => {
  const watchlist = ['XAU=F', 'EURUSD=X']
  const puts: string[][] = []
  await baseRoutes(page, watchlist, puts)
  await passwordStep(page)
  await page.waitForURL('**/dashboard')

  await page.getByRole('button', { name: 'Edit watchlist' }).click()
  await expect(page.getByText('Your watchlist (2)')).toBeVisible()

  // Catalog rows are now menuitems (roving-focus a11y).
  await page.getByRole('menuitem', { name: /S&P 500/ }).click()
  await expect(page.getByText('Your watchlist (3)')).toBeVisible()
  expect(puts.at(-1)).toEqual(['XAU=F', 'EURUSD=X', '^GSPC'])
})
