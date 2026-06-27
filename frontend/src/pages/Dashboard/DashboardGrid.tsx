import { useMemo } from 'react'
import { GridLayout, useContainerWidth, verticalCompactor } from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'
import { cn } from '@/lib/cn'
import { BREAKPOINTS, COLS, type GridItem, useLayout } from '@/store/useLayout'
import { WIDGETS } from './widgets/registry'

const MARGIN: [number, number] = [16, 16]

/** The active responsive breakpoint key for a given container width. */
function breakpointForWidth(width: number): string {
  let best = 'xxs'
  let bestMin = -1
  for (const [bp, min] of Object.entries(BREAKPOINTS)) {
    if (width >= min && min > bestMin) {
      best = bp
      bestMin = min
    }
  }
  return best
}

/**
 * We drive the base, non-responsive `GridLayout` ourselves (picking the layout
 * and column count for the current width) rather than `Responsive`. The
 * responsive wrapper re-derives its child layout on every render, which in this
 * RGL version feeds an internal `setState` loop ("Maximum update depth
 * exceeded") as soon as a widget is added. A single stable layout avoids it.
 */
export function DashboardGrid() {
  const widgets = useLayout((s) => s.widgets)
  const layouts = useLayout((s) => s.layouts)
  const editMode = useLayout((s) => s.editMode)
  const commitLayout = useLayout((s) => s.commitLayout)
  const removeWidget = useLayout((s) => s.removeWidget)
  const { width, containerRef, mounted } = useContainerWidth()

  const bp = breakpointForWidth(width)
  const cols = COLS[bp]
  // Clamp width/minW to the column count so legacy or narrow-breakpoint layouts
  // (e.g. a minW:3 widget on the 2-col xxs grid) can't render wider than the
  // container. Memoized to preserve RGL's stable-`layout` identity contract.
  const layout = useMemo(() => {
    const items = layouts[bp] ?? []
    return items.map((it) => {
      const minW = it.minW != null ? Math.min(it.minW, cols) : undefined
      const w = Math.min(it.w, cols)
      return it.w === w && it.minW === minW ? it : { ...it, w, minW }
    })
  }, [layouts, bp, cols])

  // Stable config identities (the base GridLayout bundles cols/rowHeight/margin
  // into `gridConfig`).
  const gridConfig = useMemo(() => ({ cols, rowHeight: 64, margin: MARGIN }), [cols])
  // Drag from anywhere on the card (not just the header grip) so moving a widget
  // is discoverable; `.no-drag` still shields interactive controls (inputs,
  // remove/refresh buttons, links).
  const dragConfig = useMemo(() => ({ enabled: editMode, cancel: '.no-drag' }), [editMode])
  const resizeConfig = useMemo(
    () => ({ enabled: editMode, handles: ['se', 's', 'e'] as const }),
    [editMode],
  )

  // Stable child identities — RGL diffs `children` in a layout-sync effect, and
  // a fresh array each render would keep that effect setState-ing.
  const children = useMemo(
    () =>
      widgets
        .map((inst) => {
          const def = WIDGETS[inst.type]
          if (!def) return null
          return (
            <div key={inst.id}>
              {def.render({ editMode, onRemove: () => removeWidget(inst.id) }, inst.config)}
            </div>
          )
        })
        .filter(Boolean),
    [widgets, editMode, removeWidget],
  )

  const persist = (next: readonly GridItem[]) => commitLayout(bp, next as GridItem[])

  return (
    <div ref={containerRef} className={cn('-mx-2', editMode && 'rgl-editing')}>
      {mounted && (
        <GridLayout
          width={width}
          layout={layout}
          gridConfig={gridConfig}
          compactor={verticalCompactor}
          dragConfig={dragConfig}
          resizeConfig={resizeConfig}
          onDragStop={(l) => persist(l as unknown as GridItem[])}
          onResizeStop={(l) => persist(l as unknown as GridItem[])}
        >
          {children}
        </GridLayout>
      )}
    </div>
  )
}
