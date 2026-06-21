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

test('removeWidget drops the instance and its layout item', () => {
  useLayout.setState({
    widgets: [{ id: 'gold', type: 'gold' }],
    layouts: { lg: [{ i: 'gold', x: 0, y: 0, w: 3, h: 3 }] },
  })
  useLayout.getState().removeWidget('gold')
  expect(useLayout.getState().widgets).toHaveLength(0)
  expect(useLayout.getState().layouts.lg).toHaveLength(0)
})
