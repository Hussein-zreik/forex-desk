import { Plus } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useLayout } from '@/store/useLayout'
import { WIDGET_LIST } from './widgets/registry'

export function AddWidgetMenu() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const widgets = useLayout((s) => s.widgets)
  const addWidget = useLayout((s) => s.addWidget)

  const present = new Set(widgets.map((w) => w.type))
  const available = WIDGET_LIST.filter(
    (d) => !present.has(d.type) && d.title.toLowerCase().includes(query.toLowerCase()),
  )

  return (
    <div className="relative">
      <Button size="sm" variant="secondary" onClick={() => setOpen((v) => !v)}>
        <Plus className="h-4 w-4" /> Add widget
      </Button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden />
          <div className="absolute right-0 z-50 mt-2 w-64 rounded-xl border border-border bg-popover p-2 shadow-card-hover">
            <Input
              autoFocus
              placeholder="Search widgets…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="mb-2"
            />
            <ul className="max-h-64 overflow-auto">
              {available.length === 0 ? (
                <li className="px-2 py-3 text-center text-xs text-muted-foreground">
                  No widgets to add
                </li>
              ) : (
                available.map((d) => (
                  <li key={d.type}>
                    <button
                      type="button"
                      onClick={() => {
                        addWidget(d.type)
                        setOpen(false)
                        setQuery('')
                      }}
                      className="flex w-full cursor-pointer items-center justify-between rounded-lg px-2 py-2 text-left text-sm hover:bg-surface"
                    >
                      <span>{d.title}</span>
                      <span className="text-[10px] tracking-wide text-muted-foreground uppercase">
                        {d.category}
                      </span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
        </>
      )}
    </div>
  )
}
