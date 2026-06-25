import { vi } from 'vitest'
import { useLayout } from './useLayout'

// Avoid real network from the debounced save.
vi.mock('@/lib/api', () => ({ api: vi.fn(() => Promise.resolve({})) }))

beforeEach(() => {
  useLayout.setState({ widgets: [], layouts: {}, editMode: false, loaded: false })
})

test('reset populates the six default widgets', () => {
  useLayout.getState().reset()
  const { widgets, layouts } = useLayout.getState()
  expect(widgets).toHaveLength(6)
  expect(layouts.lg).toHaveLength(6)
})

test('default layouts clamp width and minW to each breakpoint column count', () => {
  useLayout.getState().reset()
  const { layouts } = useLayout.getState()
  // xxs has 2 columns; defaults include `bias` (minW 3), which must be clamped.
  for (const it of layouts.xxs) {
    expect(it.w).toBeLessThanOrEqual(2)
    expect(it.minW ?? 0).toBeLessThanOrEqual(2)
  }
})

test('addWidget clamps minW to the breakpoint column count', () => {
  useLayout.setState({ widgets: [], layouts: { xxs: [] } })
  // `bias` declares minW 3; on the 2-col xxs grid it must be clamped to 2.
  useLayout.getState().addWidget('bias')
  const item = useLayout.getState().layouts.xxs.find((i) => i.i === 'bias')!
  expect(item.w).toBeLessThanOrEqual(2)
  expect(item.minW ?? 0).toBeLessThanOrEqual(2)
})

test('addWidget adds an instance and a layout item', () => {
  useLayout.setState({ widgets: [], layouts: { lg: [] } })
  useLayout.getState().addWidget('gold')
  const { widgets, layouts } = useLayout.getState()
  expect(widgets).toEqual([{ id: 'gold', type: 'gold' }])
  expect(layouts.lg.some((i) => i.i === 'gold')).toBe(true)
})

test('addWidget is idempotent per type', () => {
  useLayout.setState({
    widgets: [{ id: 'gold', type: 'gold' }],
    layouts: { lg: [{ i: 'gold', x: 0, y: 0, w: 3, h: 3 }] },
  })
  useLayout.getState().addWidget('gold')
  expect(useLayout.getState().widgets).toHaveLength(1)
})

test('addWidget places the new item without overlapping existing ones', () => {
  useLayout.setState({
    widgets: [{ id: 'gold', type: 'gold' }],
    layouts: { lg: [{ i: 'gold', x: 0, y: 0, w: 3, h: 3 }] },
  })
  useLayout.getState().addWidget('eurusd')
  const items = useLayout.getState().layouts.lg
  const a = items.find((i) => i.i === 'gold')!
  const b = items.find((i) => i.i === 'eurusd')!
  const overlap = a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
  expect(overlap).toBe(false)
})

test('commitLayout writes a breakpoint and ignores no-op updates', () => {
  useLayout.setState({
    widgets: [{ id: 'gold', type: 'gold' }],
    layouts: { lg: [{ i: 'gold', x: 0, y: 0, w: 3, h: 3 }] },
  })
  useLayout.getState().commitLayout('lg', [{ i: 'gold', x: 4, y: 2, w: 3, h: 3 }])
  expect(useLayout.getState().layouts.lg[0]).toMatchObject({ x: 4, y: 2 })
  const ref = useLayout.getState().layouts
  // identical layout → no state churn (same object reference kept)
  useLayout.getState().commitLayout('lg', [{ i: 'gold', x: 4, y: 2, w: 3, h: 3 }])
  expect(useLayout.getState().layouts).toBe(ref)
})

test('removeWidget drops the instance and its layout item', () => {
  useLayout.setState({
    widgets: [{ id: 'gold', type: 'gold' }],
    layouts: { lg: [{ i: 'gold', x: 0, y: 0, w: 3, h: 3 }] },
  })
  useLayout.getState().removeWidget('gold')
  expect(useLayout.getState().widgets).toHaveLength(0)
  expect(useLayout.getState().layouts.lg).toHaveLength(0)
})
