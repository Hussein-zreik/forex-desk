import { expect, test } from '@playwright/test'

const j = (o: unknown) => ({
  status: 200,
  contentType: 'application/json',
  body: JSON.stringify(o),
})

test('demo dashboard works logged-out with zero authed calls', async ({ page }) => {
  const authedCalls: string[] = []

  await page.route('**/api/**', (route) => {
    const req = route.request()
    if (req.headers()['authorization']) authedCalls.push(req.url())
    const path = req.url().split('?')[0]
    if (path.endsWith('/api/quotes')) {
      const url = req.url()
      const syms = decodeURIComponent((url.split('symbols=')[1] || '').split('&')[0])
        .split(',')
        .filter(Boolean)
      return route.fulfill(
        j({
          quotes: syms.map((s) => ({
            symbol: s,
            price: 4000,
            change: 12,
            changePercent: 0.3,
          })),
        }),
      )
    }
    if (path.endsWith('/api/indicators/composite'))
      return route.fulfill(
        j({
          symbol: 'XAU=F',
          signals: [{ label: 'Macro Regime', dir: 'bull' }],
          score: 17,
          label: 'NEUTRAL',
          bullish: 1,
          bearish: 0,
        }),
      )
    if (path.endsWith('/api/bias/stats'))
      return route.fulfill(
        j({
          symbol: 'XAU=F',
          snapshots: 40,
          h1d: { correct: 15, wrong: 10, n: 25, hit_rate: 60.0 },
          h1w: { correct: 2, wrong: 1, n: 3, hit_rate: 66.7 },
        }),
      )
    if (path.endsWith('/api/bias/history'))
      return route.fulfill(j({ symbol: 'XAU=F', points: [] }))
    return route.fulfill(
      j({ error: 'unavailable', articles: [], sentiment: {}, points: [], latest: null }),
    )
  })

  await page.goto('/demo')

  // No auth redirect: we stay on /demo and see the demo chrome.
  await expect(page).toHaveURL(/\/demo$/)
  await expect(page.getByText(/live demo/i).first()).toBeVisible()
  await expect(page.getByText(/the data is real, the layout is fixed/i)).toBeVisible()

  // Live widgets render real (mocked) quote data.
  await expect(page.getByText('Gold — XAU/USD')).toBeVisible()
  await expect(page.getByRole('link', { name: /sign up free/i })).toBeVisible()

  // The product's paid-off claim: not a single request carried a token.
  expect(authedCalls).toEqual([])
})

test('landing links the demo where it claims no login is needed', async ({ page }) => {
  await page.route('**/api/**', (route) => route.fulfill(j({ quotes: [] })))
  await page.goto('/')
  await page.getByRole('link', { name: /try the live demo/i }).click()
  await expect(page).toHaveURL(/\/demo$/)
})
