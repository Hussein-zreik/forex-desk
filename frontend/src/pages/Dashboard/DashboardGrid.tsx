import { useMemo } from 'react'
import { GridLayout, noCompactor, useContainerWidth } from 'react-grid-layout'
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
  const layout = layouts[bp] ?? []

  // Stable config identities (the base GridLayout bundles cols/rowHeight/margin
  // into `gridConfig`).
  const gridConfig = useMemo(() => ({ cols, rowHeight: 64, margin: MARGIN }), [cols])
  const dragConfig = useMemo(
    () => ({ enabled: editMode, handle: '.widget-drag-handle', cancel: '.no-drag' }),
    [editMode],
  )
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
              {def.render({ editMode, onRemove: () => removeWidget(inst.id) })}
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
          compactor={noCompactor}
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
