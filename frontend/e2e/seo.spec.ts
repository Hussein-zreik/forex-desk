import { expect, test } from '@playwright/test'

// Raw-HTML assertions: what a crawler sees BEFORE any JavaScript runs.
test('public routes carry distinct prerendered meta', async ({ request }) => {
  const cases = [
    ['/economic-calendar', 'Economic Calendar'],
    ['/cot', 'COT Report'],
    ['/gold-seasonality', 'Gold Seasonality'],
    ['/demo', 'Live demo'],
  ] as const

  for (const [path, marker] of cases) {
    // vite preview's SPA fallback doesn't resolve directory indexes, so fetch
    // the prerendered file directly; in production the backend SPA handler
    // serves it for the clean path (app/main.py).
    const res = await request.get(`${path}/index.html`)
    expect(res.ok()).toBe(true)
    const html = await res.text()
    expect(html, `${path} og:title`).toMatch(
      new RegExp(`<meta property="og:title" content="[^"]*${marker}[^"]*"`),
    )
    expect(html, `${path} canonical`).toContain(`<link rel="canonical" href=`)
  }
})

test('sitemap and robots are served', async ({ request }) => {
  const sitemap = await request.get('/sitemap.xml')
  expect(sitemap.ok()).toBe(true)
  const xml = await sitemap.text()
  expect(xml).toContain('/economic-calendar</loc>')
  expect(xml).toContain('/cot</loc>')

  const robots = await request.get('/robots.txt')
  expect(robots.ok()).toBe(true)
  expect(await robots.text()).toContain('Sitemap:')
})

test('the calendar page renders and hydrates its title', async ({ page }) => {
  await page.route('**/api/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ events: [], error: 'unavailable' }),
    }),
  )
  await page.goto('/economic-calendar')
  await expect(page.getByRole('heading', { level: 1, name: 'Economic Calendar' })).toBeVisible()
  await expect(page).toHaveTitle(/Economic Calendar/)
  await expect(page.getByRole('link', { name: /build your free desk/i })).toBeVisible()
})
