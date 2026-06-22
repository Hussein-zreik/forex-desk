import { act, renderHook } from '@testing-library/react'
import { expect, test } from 'vitest'
import { useVirtualRows } from './useVirtualRows'

// jsdom has no layout, so pin clientHeight/scrollTop explicitly for determinism.
function makeContainer(clientHeight: number, scrollTop = 0) {
  const div = document.createElement('div')
  Object.defineProperty(div, 'clientHeight', { value: clientHeight, configurable: true })
  Object.defineProperty(div, 'scrollTop', { value: scrollTop, writable: true, configurable: true })
  return div
}

test('windows from the top on mount', () => {
  const div = makeContainer(480) // 10 visible rows of 48px
  const { result } = renderHook(() =>
    useVirtualRows({ current: div }, { count: 200, rowHeight: 48, overscan: 8 }),
  )
  // visible = ceil(480/48) + overscan*2 = 10 + 16 = 26
  expect(result.current.start).toBe(0)
  expect(result.current.end).toBe(26)
  expect(result.current.topPad).toBe(0)
  expect(result.current.bottomPad).toBe((200 - 26) * 48)
})

test('recomputes the window on scroll', () => {
  const div = makeContainer(480)
  const { result } = renderHook(() =>
    useVirtualRows({ current: div }, { count: 200, rowHeight: 48, overscan: 8 }),
  )
  act(() => {
    div.scrollTop = 4800 // scrolled past 100 rows
    div.dispatchEvent(new Event('scroll'))
  })
  // start = floor(4800/48) - 8 = 100 - 8 = 92
  expect(result.current.start).toBe(92)
  expect(result.current.end).toBe(118)
  expect(result.current.topPad).toBe(92 * 48)
})

test('renders the whole range when it fits', () => {
  const div = makeContainer(2000) // taller than the content
  const { result } = renderHook(() =>
    useVirtualRows({ current: div }, { count: 10, rowHeight: 48, overscan: 8 }),
  )
  expect(result.current.start).toBe(0)
  expect(result.current.end).toBe(10)
  expect(result.current.bottomPad).toBe(0)
})
