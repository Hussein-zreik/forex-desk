import { fmtAgo, fmtPrice, fmtSigned } from './format'

test('fmtPrice uses 4 decimals under 10 and 2 above, dash for null', () => {
  expect(fmtPrice(1.2345)).toBe('1.2345')
  expect(fmtPrice(2350.5)).toBe('2,350.50')
  expect(fmtPrice(null)).toBe('—')
})

test('fmtSigned prefixes a sign', () => {
  expect(fmtSigned(1.5)).toBe('+1.50')
  expect(fmtSigned(-1.5)).toBe('-1.50')
})

test('fmtAgo renders compact relative time', () => {
  const now = 1_000_000_000_000
  expect(fmtAgo(now, now)).toBe('now')
  expect(fmtAgo(now - 30_000, now)).toBe('30s')
  expect(fmtAgo(now - 5 * 60_000, now)).toBe('5m')
  expect(fmtAgo(now - 3 * 3_600_000, now)).toBe('3h')
  expect(fmtAgo(null, now)).toBe('')
})
