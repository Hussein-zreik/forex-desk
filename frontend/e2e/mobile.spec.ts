import { expect, type Page, test } from '@playwright/test'

const j = (o: unknown) => ({
  status: 200,
  contentType: 'application/json',
  body: JSON.stringify(o),
})

async function mockApi(page: Page, layoutPuts: unknown[]) {
  await page.route('**/api/**', (route) => {
    const url = route.request().url()
    const path = url.split('?')[0]
    if (path.endsWith('/api/auth/login') || path.endsWith('/api/auth/register'))
      return route.fulfill(j({ access_token: 'e2e-token' }))
    if (path.endsWith('/api/auth/me'))
      return route.fulfill(
        j({ id: '1', email: 'e2e@test.dev', theme: 'dark', email_verified: true }),
      )
    if (path.endsWith('/api/layout')) {
      if (route.request().method() === 'PUT') {
        layoutPuts.push(route.request().postDataJSON())
        return route.fulfill(j({ ok: true }))
      }
      return route.fulfill(j({ widgets: [], layouts: {} })) // app builds defaults
    }
    if (path.endsWith('/api/journal')) return route.fulfill(j([]))
    if (path.endsWith('/api/watchlist'))
      return route.fulfill(j({ symbols: ['XAU=F', 'EURUSD=X', 'BTC-USD'], catalog: [] }))
    if (path.endsWith('/api/quotes')) {
      const syms = decodeURIComponent((url.split('symbols=')[1] || '').split('&')[0])
        .split(',')
        .filter(Boolean)
      return route.fulfill(
        j({ quotes: syms.map((s) => ({ symbol: s, price: 100, change: 1, changePercent: 1 })) }),
      )
    }
    return route.fulfill(j({ error: 'unavailable', articles: [], sentiment: {}, points: [] }))
  })
}

async function login(page: Page, layoutPuts: unknown[] = []) {
  await mockApi(page, layoutPuts)
  await page.goto('/login')
  await page.locator('input[type=email]').fill('e2e@test.dev')
  await page.locator('input[type=password]').fill('password123')
  await page.locator('button[type=submit]').click()
  await page.waitForURL('**/dashboard')
}

test('dashboard renders as a single column with no horizontal scroll', async ({ page }) => {
  await login(page)
  const list = page.getByTestId('mobile-widget-list')
  await expect(list).toBeVisible()
  // No react-grid-layout on phones.
  expect(await page.locator('.react-grid-item').count()).toBe(0)

  // Single column: every widget wrapper spans the same x/width.
  const boxes = await list.locator(':scope > div').evaluateAll((els) =>
    els.map((e) => {
      const r = e.getBoundingClientRect()
      return { x: Math.round(r.x), w: Math.round(r.width) }
    }),
  )
  expect(boxes.length).toBeGreaterThan(2)
  expect(new Set(boxes.map((b) => `${b.x}:${b.w}`)).size).toBe(1)

  // The page itself never scrolls horizontally.
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  )
  expect(overflow).toBeLessThanOrEqual(0)
})

test('bottom nav is visible and navigates', async ({ page }) => {
  await login(page)
  const nav = page.getByRole('navigation', { name: 'Primary' })
  await expect(nav).toBeVisible()
  await nav.getByRole('link', { name: /journal/i }).click()
  await expect(page).toHaveURL(/\/journal$/)
  // Wait for the lazy Journal chunk to render: the route-level Suspense swaps
  // the whole tree while loading, which would detach the nav link mid-click.
  await expect(page.getByRole('heading', { name: 'Journal' })).toBeVisible()
  await nav.getByRole('link', { name: /desk/i }).click()
  await expect(page).toHaveURL(/\/dashboard$/)
})

test('edit mode reorders with buttons and persists the layout', async ({ page }) => {
  const layoutPuts: unknown[] = []
  await login(page, layoutPuts)
  await page.getByRole('button', { name: /^Edit$/ }).click()

  const list = page.getByTestId('mobile-widget-list')
  const titles = () => list.locator('h3').allTextContents()
  const before = await titles()
  expect(before.length).toBeGreaterThan(2)

  // First widget's "move down" control (registry titles can differ from the
  // frame heading, so target by position rather than name).
  await list.locator('button[aria-label^="Move"][aria-label$=" down"]').first().click()
  await expect.poll(titles).toEqual([before[1], before[0], ...before.slice(2)])

  // The reorder reaches the layout endpoint (debounced save).
  await expect.poll(() => layoutPuts.length, { timeout: 5000 }).toBeGreaterThan(0)
})
