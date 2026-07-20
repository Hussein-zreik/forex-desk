import { expect, type Page, test } from '@playwright/test'

const j = (o: unknown) => ({
  status: 200,
  contentType: 'application/json',
  body: JSON.stringify(o),
})

function quote(sym: string) {
  let h = 0
  for (const c of sym) h = (h * 31 + c.charCodeAt(0)) % 100000
  const price = +(1 + (h % 5000) / 100).toFixed(4)
  const cp = +(((h % 400) / 100) - 2).toFixed(2)
  return { symbol: sym, price, change: +((price * cp) / 100).toFixed(4), changePercent: cp }
}

/** Mock the whole API so the E2E is self-contained (no backend, no network). */
async function mockApi(page: Page) {
  await page.route('**/api/**', (route) => {
    const url = route.request().url()
    const path = url.split('?')[0]
    if (path.endsWith('/api/auth/login') || path.endsWith('/api/auth/register'))
      return route.fulfill(j({ access_token: 'e2e-token' }))
    if (path.endsWith('/api/auth/me'))
      return route.fulfill(j({ id: '1', email: 'e2e@test.dev', theme: 'dark' }))
    if (path.endsWith('/api/watchlist'))
      return route.fulfill(j({ symbols: ['XAU=F', 'EURUSD=X', 'BTC-USD'], catalog: [] }))
    if (path.endsWith('/api/layout')) {
      if (route.request().method() !== 'GET') return route.fulfill(j({ ok: true }))
      return route.fulfill(j({ widgets: [], layouts: {} })) // empty → app builds defaults
    }
    if (path.endsWith('/api/quotes')) {
      const syms = decodeURIComponent((url.split('symbols=')[1] || '').split('&')[0])
        .split(',')
        .filter(Boolean)
      return route.fulfill(j({ quotes: syms.map(quote) }))
    }
    return route.fulfill(j({ error: 'unavailable' }))
  })
}

async function login(page: Page) {
  await mockApi(page)
  await page.goto('/login')
  await page.locator('input[type=email]').fill('e2e@test.dev')
  await page.locator('input[type=password]').fill('password123')
  await page.locator('button[type=submit]').click()
  await page.waitForURL('**/dashboard')
}

async function boxes(page: Page) {
  return page.locator('.react-grid-item').evaluateAll((els) =>
    els.map((e) => {
      const r = e.getBoundingClientRect()
      return { x: r.x, y: r.y, w: r.width, h: r.height }
    }),
  )
}

function overlaps(bs: { x: number; y: number; w: number; h: number }[]) {
  for (let i = 0; i < bs.length; i++) {
    for (let k = i + 1; k < bs.length; k++) {
      const a = bs[i]
      const b = bs[k]
      const ox = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)
      const oy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y)
      if (ox > 5 && oy > 5) return true
    }
  }
  return false
}

test('login lands on the dashboard with widgets', async ({ page }) => {
  await login(page)
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
  await expect(page.locator('.react-grid-item').first()).toBeVisible()
  // react-grid-layout applies absolute positions a tick after mount (items are
  // briefly stacked at 0,0), so poll until the grid settles to no overlaps.
  await expect.poll(async () => overlaps(await boxes(page)), { timeout: 5000 }).toBe(false)
})

test('edit mode: dragging a widget keeps the grid overlap-free', async ({ page }) => {
  await login(page)
  await page.getByRole('button', { name: /^Edit$/ }).click()
  const items = page.locator('.react-grid-item')
  await items.first().scrollIntoViewIfNeeded()
  const src = await items.nth(1).boundingBox()
  const dst = await items.nth(0).boundingBox()
  if (!src || !dst) throw new Error('grid items not found')
  await page.mouse.move(src.x + src.width / 2, src.y + 40)
  await page.mouse.down()
  await page.mouse.move(dst.x + dst.width / 2 + 20, dst.y + 40, { steps: 16 })
  await page.mouse.up()
  await expect.poll(async () => overlaps(await boxes(page)), { timeout: 5000 }).toBe(false)
})

test('add-widget menu stays open and grows the grid', async ({ page }) => {
  await login(page)
  await page.getByRole('button', { name: /^Edit$/ }).click()
  const before = await page.locator('.react-grid-item').count()
  await page.getByRole('button', { name: /Add widget/i }).click()
  await page.locator('ul li button').first().click()
  // The menu's search box stays visible (you can keep adding).
  await expect(page.getByPlaceholder('Search widgets…')).toBeVisible()
  await expect.poll(() => page.locator('.react-grid-item').count()).toBeGreaterThan(before)
})
