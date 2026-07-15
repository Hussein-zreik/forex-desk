import type { LayoutItem } from 'react-grid-layout'
import { describe, expect, it } from 'vitest'
import { flowCompactor } from './flowCompactor'

const item = (i: string, x: number, y: number, w: number, h: number): LayoutItem => ({
  i,
  x,
  y,
  w,
  h,
})

function overlaps(layout: readonly LayoutItem[]): boolean {
  for (let a = 0; a < layout.length; a++) {
    for (let b = a + 1; b < layout.length; b++) {
      const p = layout[a]
      const q = layout[b]
      if (p.x < q.x + q.w && q.x < p.x + p.w && p.y < q.y + q.h && q.y < p.y + p.h) return true
    }
  }
  return false
}

const byId = (layout: readonly LayoutItem[], id: string) => {
  const found = layout.find((l) => l.i === id)
  if (!found) throw new Error(`missing ${id}`)
  return found
}

describe('flowCompactor', () => {
  it('flows items left-to-right and wraps at the grid edge', () => {
    const out = flowCompactor.compact(
      [item('a', 0, 0, 4, 4), item('b', 4, 0, 4, 4), item('c', 8, 0, 4, 4), item('d', 0, 4, 4, 6)],
      12,
    )
    expect(byId(out, 'a')).toMatchObject({ x: 0, y: 0 })
    expect(byId(out, 'b')).toMatchObject({ x: 4, y: 0 })
    expect(byId(out, 'c')).toMatchObject({ x: 8, y: 0 })
    expect(byId(out, 'd')).toMatchObject({ x: 0, y: 4 }) // wrapped below the first shelf
  })

  it('starts each shelf below the tallest card of the previous one (mixed heights)', () => {
    // RGL's stock wrapCompactor fails exactly this: it ignores heights entirely.
    const out = flowCompactor.compact(
      [item('a', 0, 0, 6, 6), item('b', 6, 0, 6, 3), item('c', 0, 6, 4, 4)],
      12,
    )
    expect(byId(out, 'c')).toMatchObject({ x: 0, y: 6 }) // below the h=6 card, not h=3
    expect(overlaps(out)).toBe(false)
  })

  it('reinserts a dragged card at its drop position and slides neighbours along', () => {
    // "b" was dragged onto the start of the first shelf (x:0, y:0 beats "a"'s x:0
    // via original-index tie-break loss… use x slightly left: y equal, x lower).
    const dragged = [
      item('a', 2, 0, 4, 4), // original first card, nudged right by the drag preview
      item('b', 0, 0, 4, 4), // dragged card dropped at the row start
      item('c', 8, 0, 4, 4),
    ]
    const out = flowCompactor.compact(dragged, 12)
    expect(byId(out, 'b')).toMatchObject({ x: 0, y: 0 })
    expect(byId(out, 'a')).toMatchObject({ x: 4, y: 0 })
    expect(byId(out, 'c')).toMatchObject({ x: 8, y: 0 })
  })

  it('never overlaps for arbitrary size mixes', () => {
    const sizes: [number, number][] = [
      [4, 4],
      [6, 6],
      [3, 2],
      [12, 3],
      [5, 7],
      [4, 6],
      [8, 2],
      [2, 2],
    ]
    const layout = sizes.map(([w, h], k) => item(`w${k}`, (k * 3) % 12, k, w, h))
    const out = flowCompactor.compact(layout, 12)
    expect(overlaps(out)).toBe(false)
    // Every card keeps its exact size — flow never distorts neighbours.
    for (const [k, [w, h]] of sizes.entries()) {
      expect(byId(out, `w${k}`)).toMatchObject({ w, h })
    }
  })

  it('clamps a card wider than the grid to the column count', () => {
    const out = flowCompactor.compact([item('a', 0, 0, 10, 4)], 6)
    expect(byId(out, 'a')).toMatchObject({ x: 0, y: 0, w: 6 })
  })

  it('handles an empty layout', () => {
    expect(flowCompactor.compact([], 12)).toEqual([])
  })
})
