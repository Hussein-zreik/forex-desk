import { pipsBetween, pipValueUsd, positionSize, riskReward } from './risk'

test('pip value is $10/lot for USD-quoted majors', () => {
  expect(pipValueUsd('EURUSD=X', 1.1)).toBeCloseTo(10)
})

test('pip value for USD-based pairs divides by price', () => {
  // USD/JPY at 150: 0.01 * 100000 / 150 ≈ 6.667
  expect(pipValueUsd('USDJPY=X', 150)).toBeCloseTo(6.6667, 3)
})

test('gold pip value is $1/lot per 0.01 (100oz contract)', () => {
  expect(pipValueUsd('XAU=F', 2350)).toBeCloseTo(1)
})

test('pipsBetween counts pips with the right pip size', () => {
  expect(pipsBetween('EURUSD=X', 1.105, 1.1)).toBeCloseTo(50)
  expect(pipsBetween('USDJPY=X', 150.5, 150.0)).toBeCloseTo(50)
})

test('positionSize risks exactly riskPct of balance at the stop', () => {
  // $10k, 1% risk = $100. EURUSD entry 1.1000 stop 1.0950 → 50 pips, $10/pip.
  const r = positionSize({
    balance: 10_000,
    riskPct: 1,
    entry: 1.1,
    stop: 1.095,
    symbol: 'EURUSD=X',
  })!
  expect(r.riskUsd).toBeCloseTo(100)
  expect(r.stopPips).toBeCloseTo(50)
  expect(r.lots).toBeCloseTo(0.2) // 100 / (50 * 10)
  expect(r.units).toBeCloseTo(20_000)
})

test('positionSize returns null when stop equals entry', () => {
  expect(
    positionSize({ balance: 10_000, riskPct: 1, entry: 1.1, stop: 1.1, symbol: 'EURUSD=X' }),
  ).toBeNull()
})

test('riskReward divides reward by risk', () => {
  expect(riskReward(1.1, 1.095, 1.115)).toBeCloseTo(3) // 150 / 50 (price terms)
  expect(riskReward(1.1, 1.1, 1.2)).toBeNull()
})
