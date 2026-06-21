import { Responsive, useContainerWidth } from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'
import { BREAKPOINTS, COLS, type Layouts, useLayout } from '@/store/useLayout'
import { WIDGETS } from './widgets/registry'

export function DashboardGrid() {
  const widgets = useLayout((s) => s.widgets)
  const layouts = useLayout((s) => s.layouts)
  const editMode = useLayout((s) => s.editMode)
  const setLayouts = useLayout((s) => s.setLayouts)
  const removeWidget = useLayout((s) => s.removeWidget)
  const { width, containerRef, mounted } = useContainerWidth()

  return (
    <div ref={containerRef} className="-mx-2">
      {mounted && (
        <Responsive
          width={width}
          layouts={layouts}
          breakpoints={BREAKPOINTS}
          cols={COLS}
          rowHeight={64}
          margin={[16, 16]}
          dragConfig={{
            enabled: editMode,
            handle: '.widget-drag-handle',
            cancel: '.no-drag',
          }}
          resizeConfig={{ enabled: editMode }}
          onLayoutChange={(_layout, all) => setLayouts(all as unknown as Layouts)}
        >
          {widgets.map((inst) => {
            const def = WIDGETS[inst.type]
            if (!def) return null
            return (
              <div key={inst.id}>
                {def.render({ editMode, onRemove: () => removeWidget(inst.id) })}
              </div>
            )
          })}
        </Responsive>
      )}
    </div>
  )
}
