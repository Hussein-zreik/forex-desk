import { vi } from 'vitest'
import { reconcileLayouts, useLayout } from './useLayout'

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
  const item = useLayout.getState().layouts.xxs[0]
  expect(item.w).toBeLessThanOrEqual(2)
  expect(item.minW ?? 0).toBeLessThanOrEqual(2)
})

test('default layouts give every widget in a row the same height', () => {
  useLayout.getState().reset()
  const { layouts } = useLayout.getState()
  for (const bp of Object.keys(layouts)) {
    const byRow: Record<number, number[]> = {}
    for (const it of layouts[bp]) (byRow[it.y] ??= []).push(it.h)
    for (const heights of Object.values(byRow)) {
      expect(new Set(heights).size).toBe(1) // one height per row
    }
  }
})

test('default layouts justify every row to span the full column width', () => {
  useLayout.getState().reset()
  const { layouts } = useLayout.getState()
  const COLS: Record<string, number> = { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }
  for (const [bp, cols] of Object.entries(COLS)) {
    const byRow: Record<number, number> = {}
    for (const it of layouts[bp]) byRow[it.y] = (byRow[it.y] ?? 0) + it.w
    for (const used of Object.values(byRow)) expect(used).toBe(cols) // no right-edge gap
  }
})

test('addWidget adds an instance with a unique id and a layout item', () => {
  useLayout.setState({ widgets: [], layouts: { lg: [] } })
  useLayout.getState().addWidget('gold')
  const { widgets, layouts } = useLayout.getState()
  expect(widgets).toHaveLength(1)
  expect(widgets[0].type).toBe('gold')
  expect(widgets[0].id).not.toBe('gold') // unique, not the bare type
  expect(layouts.lg.some((i) => i.i === widgets[0].id)).toBe(true)
})

test('addWidget allows multiple instances of the same type', () => {
  useLayout.setState({ widgets: [], layouts: { lg: [] } })
  useLayout.getState().addWidget('bias', { symbol: 'XAU=F' })
  useLayout.getState().addWidget('bias', { symbol: 'EURUSD=X' })
  const { widgets } = useLayout.getState()
  expect(widgets).toHaveLength(2)
  expect(new Set(widgets.map((w) => w.id)).size).toBe(2) // distinct ids
  expect(widgets.map((w) => w.config?.symbol)).toEqual(['XAU=F', 'EURUSD=X'])
})

test('addWidget places the new item without overlapping existing ones', () => {
  useLayout.setState({ widgets: [], layouts: { lg: [] } })
  useLayout.getState().addWidget('gold')
  useLayout.getState().addWidget('eurusd')
  const { widgets, layouts } = useLayout.getState()
  const a = layouts.lg.find((i) => i.i === widgets[0].id)!
  const b = layouts.lg.find((i) => i.i === widgets[1].id)!
  const overlap = a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
  expect(overlap).toBe(false)
})

test('reconcileLayouts drops orphans, appends missing items, and clamps to cols', () => {
  const widgets = [
    { id: 'gold', type: 'gold' },
    { id: 'bias-1', type: 'bias' },
  ]
  // lg has an orphan ('ghost') and is missing 'bias-1'; xxs is entirely absent.
  const layouts = {
    lg: [
      { i: 'gold', x: 0, y: 0, w: 3, h: 3 },
      { i: 'ghost', x: 3, y: 0, w: 3, h: 3 },
    ],
  }
  const out = reconcileLayouts(widgets, layouts)
  // orphan removed, every widget present at lg
  expect(out.lg.map((i) => i.i).sort()).toEqual(['bias-1', 'gold'])
  // missing breakpoint built, with widths/minW clamped to xxs's 2 columns
  expect(out.xxs.map((i) => i.i).sort()).toEqual(['bias-1', 'gold'])
  for (const it of out.xxs) {
    expect(it.w).toBeLessThanOrEqual(2)
    expect(it.minW ?? 0).toBeLessThanOrEqual(2)
  }
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
