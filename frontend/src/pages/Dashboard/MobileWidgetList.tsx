import { ArrowDown, ArrowUp } from 'lucide-react'
import { useMemo } from 'react'
import { useLayout } from '@/store/useLayout'
import { WIDGETS } from './widgets/registry'

/** Grid geometry shared with react-grid-layout: row height + margin. */
const ROW = 64
const GAP = 16

/**
 * Phone rendering of the dashboard: a plain single column ordered by the xxs
 * layout — no react-grid-layout, no touch drag. Reordering happens with
 * explicit up/down buttons (44px touch targets) that persist through the same
 * layout endpoint the desktop grid uses.
 */
export function MobileWidgetList() {
  const widgets = useLayout((s) => s.widgets)
  const layouts = useLayout((s) => s.layouts)
  const editMode = useLayout((s) => s.editMode)
  const removeWidget = useLayout((s) => s.removeWidget)
  const moveWidget = useLayout((s) => s.moveWidget)

  const ordered = useMemo(() => {
    const items = [...(layouts["xxs"] ?? [])].sort((a, b) => a.y - b.y || a.x - b.x)
    const byId = new Map(widgets.map((w) => [w.id, w]))
    const seen = new Set<string>()
    const result = items
      .map((it) => {
        seen.add(it.i)
        return { inst: byId.get(it.i), h: it.h }
      })
      .filter((r) => r.inst)
    // Widgets missing from the xxs layout (legacy data) still render, at the end.
    for (const w of widgets) {
      if (!seen.has(w.id)) result.push({ inst: w, h: 5 })
    }
    return result as { inst: (typeof widgets)[number]; h: number }[]
  }, [layouts, widgets])

  return (
    <div className="flex flex-col gap-4" data-testid="mobile-widget-list">
      {ordered.map(({ inst, h }, index) => {
        const def = WIDGETS[inst.type]
        if (!def) return null
        return (
          <div key={inst.id} className="relative" style={{ height: h * ROW + (h - 1) * GAP }}>
            {def.render(
              { editMode, onRemove: () => removeWidget(inst.id) },
              inst.config,
            )}
            {editMode && (
              <div className="absolute right-2 bottom-2 z-10 flex gap-1 rounded-xl border border-border bg-bg-elevated/95 p-1 shadow-card">
                <button
                  type="button"
                  onClick={() => moveWidget(inst.id, -1)}
                  disabled={index === 0}
                  aria-label={`Move ${def.title} up`}
                  className="grid h-11 w-11 place-items-center rounded-lg text-muted-foreground hover:bg-surface hover:text-foreground disabled:opacity-30"
                >
                  <ArrowUp className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => moveWidget(inst.id, 1)}
                  disabled={index === ordered.length - 1}
                  aria-label={`Move ${def.title} down`}
                  className="grid h-11 w-11 place-items-center rounded-lg text-muted-foreground hover:bg-surface hover:text-foreground disabled:opacity-30"
                >
                  <ArrowDown className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
