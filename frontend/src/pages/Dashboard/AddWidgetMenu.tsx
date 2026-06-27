import { Plus } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { IconButton } from '@/components/ui/IconButton'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { symbolLabel } from '@/lib/symbols'
import { useLayout } from '@/store/useLayout'
import { type WidgetDef, WIDGET_LIST } from './widgets/registry'

export function AddWidgetMenu() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [symbolFor, setSymbolFor] = useState<Record<string, string>>({})
  const addWidget = useLayout((s) => s.addWidget)

  // Widgets can be added more than once, so the list isn't filtered by presence.
  const available = WIDGET_LIST.filter((d) => d.title.toLowerCase().includes(query.toLowerCase()))

  function close() {
    setOpen(false)
    setQuery('')
  }

  function add(d: WidgetDef) {
    if (d.symbols?.length) {
      addWidget(d.type, { symbol: symbolFor[d.type] ?? d.symbols[0] })
    } else {
      addWidget(d.type)
    }
    // Keep the menu open so you can add several widgets in a row; every entry
    // stays in the list (widgets are multi-instance). Dismiss via the backdrop.
  }

  return (
    <div className="relative">
      <Button size="sm" variant="secondary" onClick={() => setOpen((v) => !v)}>
        <Plus className="h-4 w-4" /> Add widget
      </Button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={close} aria-hidden />
          <div className="absolute right-0 z-50 mt-2 w-72 rounded-xl border border-border bg-popover p-2 shadow-card-hover">
            <Input
              autoFocus
              placeholder="Search widgets…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="mb-2"
            />
            <ul className="max-h-72 overflow-auto">
              {available.length === 0 ? (
                <li className="px-2 py-3 text-center text-xs text-muted-foreground">
                  No widgets found
                </li>
              ) : (
                available.map((d) =>
                  d.symbols?.length ? (
                    <li key={d.type} className="flex items-center gap-2 px-2 py-1.5">
                      <span className="flex-1 truncate text-sm">{d.title}</span>
                      <Select
                        aria-label={`${d.title} symbol`}
                        wrapperClassName="w-auto"
                        className="h-8 text-xs"
                        value={symbolFor[d.type] ?? d.symbols[0]}
                        onChange={(e) => setSymbolFor((m) => ({ ...m, [d.type]: e.target.value }))}
                      >
                        {d.symbols.map((s) => (
                          <option key={s} value={s}>
                            {symbolLabel(s)}
                          </option>
                        ))}
                      </Select>
                      <IconButton
                        aria-label={`Add ${d.title}`}
                        className="h-8 w-8"
                        onClick={() => add(d)}
                      >
                        <Plus className="h-4 w-4" />
                      </IconButton>
                    </li>
                  ) : (
                    <li key={d.type}>
                      <button
                        type="button"
                        onClick={() => add(d)}
                        className="flex w-full cursor-pointer items-center justify-between rounded-lg px-2 py-2 text-left text-sm hover:bg-surface"
                      >
                        <span>{d.title}</span>
                        <span className="text-[10px] tracking-wide text-muted-foreground uppercase">
                          {d.category}
                        </span>
                      </button>
                    </li>
                  ),
                )
              )}
            </ul>
          </div>
        </>
      )}
    </div>
  )
}
