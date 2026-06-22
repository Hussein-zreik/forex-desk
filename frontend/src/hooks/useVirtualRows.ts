import { useEffect, useState, type RefObject } from 'react'

interface Options {
  count: number
  rowHeight: number
  overscan?: number
}

interface Window {
  start: number
  end: number
  topPad: number
  bottomPad: number
}

/**
 * Fixed-row-height windowing for a scrollable container: returns the slice of
 * rows to render plus top/bottom spacer heights. Keeps the DOM small for long
 * lists (e.g. an imported journal of thousands of trades).
 */
export function useVirtualRows(
  scrollRef: RefObject<HTMLElement | null>,
  { count, rowHeight, overscan = 8 }: Options,
): Window {
  const [range, setRange] = useState({ start: 0, end: count })

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    function recompute() {
      const node = scrollRef.current
      if (!node) return
      const start = Math.max(0, Math.floor(node.scrollTop / rowHeight) - overscan)
      const visible = Math.ceil(node.clientHeight / rowHeight) + overscan * 2
      const end = Math.min(count, start + visible)
      setRange((prev) => (prev.start === start && prev.end === end ? prev : { start, end }))
    }

    recompute()
    el.addEventListener('scroll', recompute, { passive: true })
    window.addEventListener('resize', recompute)
    return () => {
      el.removeEventListener('scroll', recompute)
      window.removeEventListener('resize', recompute)
    }
  }, [scrollRef, count, rowHeight, overscan])

  const start = Math.min(range.start, count)
  const end = Math.min(range.end, count)
  return {
    start,
    end,
    topPad: start * rowHeight,
    bottomPad: Math.max(0, (count - end) * rowHeight),
  }
}
