import type { Compactor, Layout, LayoutItem } from 'react-grid-layout'

/**
 * Flow ("wiggle-mode") compactor — items read like words in a paragraph.
 *
 * Cards are laid out in reading order (shelf by shelf, left→right), each shelf
 * starting directly below the tallest card of the shelf above. Dragging a card
 * re-inserts it into the sequence at the drop position, and its neighbours
 * slide along to make room — nothing is pushed up/down out of place and no
 * card's size is altered, mirroring iOS home-screen reordering.
 *
 * RGL's built-in `wrapCompactor` has the same intent but advances a scalar
 * cursor by item *width* only — it assumes every item is one row tall, so our
 * multi-row cards overlap the next shelf. This version tracks shelf height
 * (the tallest card in the row), which guarantees an overlap-free layout for
 * any mix of card sizes.
 *
 * `static` items get no special casing (this app never uses them).
 */
export const flowCompactor: Compactor = {
  type: 'wrap',
  allowOverlap: false,
  compact(layout: Layout, cols: number): Layout {
    // Reading order: shelf (y), then x. During a drag the moved card carries
    // its grid position, which decides where it re-enters the sequence; the
    // original index breaks ties so equal positions stay stable.
    const order = layout
      .map((item, idx) => ({ item, idx }))
      .sort((a, b) => a.item.y - b.item.y || a.item.x - b.item.x || a.idx - b.idx)

    const out: LayoutItem[] = new Array(layout.length)
    let x = 0
    let shelfY = 0
    let shelfH = 0
    for (const { item, idx } of order) {
      const w = Math.min(item.w, cols)
      if (x + w > cols) {
        // Wrap: next shelf starts below the tallest card of this one.
        x = 0
        shelfY += shelfH
        shelfH = 0
      }
      out[idx] = { ...item, w, x, y: shelfY, moved: false }
      x += w
      shelfH = Math.max(shelfH, item.h)
    }
    return out
  },
}
