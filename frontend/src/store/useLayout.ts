import { create } from 'zustand'
import { api } from '@/lib/api'
import { WIDGETS, type WidgetConfig } from '@/pages/Dashboard/widgets/registry'

export interface WidgetInstance {
  id: string
  type: string
  /** Per-instance config (e.g. symbol) so a type can appear more than once. */
  config?: WidgetConfig
}

/** Unique, readable instance id, e.g. "bias-3f9a1c0b". */
function newId(type: string): string {
  const rand =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10)
  return `${type}-${rand}`
}

export interface GridItem {
  i: string
  x: number
  y: number
  w: number
  h: number
  minW?: number
  minH?: number
}

export type Layouts = Record<string, GridItem[]>

export const COLS: Record<string, number> = { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }
export const BREAKPOINTS = { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }

const DEFAULT_TYPES = ['eurusd', 'gold', 'dxy', 'sessions', 'bias', 'fearGreed']

/**
 * Canonical signature of a layout's *positional* state (the only fields that
 * affect rendering). react-grid-layout fires `onLayoutChange` on every render —
 * often with an unchanged layout — so comparing signatures lets us skip
 * redundant state updates that would otherwise feed back into an infinite
 * render loop ("Maximum update depth exceeded").
 */
function layoutSignature(layouts: Layouts): string {
  return Object.keys(layouts)
    .sort()
    .map((bp) => `${bp}:` + layouts[bp].map((i) => `${i.i},${i.x},${i.y},${i.w},${i.h}`).join('|'))
    .join(';')
}

/** First-fit (top-left) slot for a w×h block that doesn't overlap `items`. */
function findSlot(items: GridItem[], w: number, h: number, cols: number): { x: number; y: number } {
  const overlaps = (x: number, y: number) =>
    items.some((it) => x < it.x + it.w && x + w > it.x && y < it.y + it.h && y + h > it.y)
  for (let y = 0; y < 1000; y++) {
    for (let x = 0; x + w <= cols; x++) {
      if (!overlaps(x, y)) return { x, y }
    }
  }
  return { x: 0, y: 0 }
}

/**
 * Stretch the widgets sharing a row so their widths sum to the full column
 * count, then re-flow their x positions left-to-right. Spare columns are handed
 * out round-robin from the left, so every row spans the full width with no
 * ragged right-edge gap. Widening only ever grows past `minW`, so it's safe.
 */
function justifyRow(rowItems: GridItem[], cols: number): void {
  const row = [...rowItems].sort((a, b) => a.x - b.x)
  let free = cols - row.reduce((sum, it) => sum + it.w, 0)
  for (let i = 0; free > 0; i++, free--) row[i % row.length].w += 1
  let x = 0
  for (const it of row) {
    it.x = x
    x += it.w
  }
}

function buildLayouts(instances: WidgetInstance[]): Layouts {
  const layouts: Layouts = {}
  for (const [bp, cols] of Object.entries(COLS)) {
    let x = 0
    let y = 0
    let rowH = 0
    const items = instances.map((inst) => {
      const def = WIDGETS[inst.type]
      const w = Math.min(def.w, cols)
      if (x + w > cols) {
        x = 0
        y += rowH
        rowH = 0
      }
      const item: GridItem = {
        i: inst.id,
        x,
        y,
        w,
        h: def.h,
        minW: Math.min(def.minW, cols),
        minH: def.minH,
      }
      x += w
      rowH = Math.max(rowH, def.h)
      return item
    })
    // Group items by row (they share `y` from packing above), then make each row
    // full-width and equal-height so the default grid is gap-free and symmetrical:
    // every row fills the width and all cards in a row line up top and bottom.
    const byRow: Record<number, GridItem[]> = {}
    for (const it of items) (byRow[it.y] ??= []).push(it)
    for (const row of Object.values(byRow)) {
      justifyRow(row, cols)
      const h = Math.max(...row.map((it) => it.h))
      for (const it of row) it.h = h
    }
    layouts[bp] = items
  }
  return layouts
}

/**
 * Make `layouts` consistent with `widgets` for every breakpoint: drop orphan
 * items, append a first-fit slot for any widget missing one, and clamp w/minW to
 * the column count. Hardens server/legacy data where a breakpoint is partial or a
 * widget was added/removed out of band.
 */
export function reconcileLayouts(widgets: WidgetInstance[], layouts: Layouts): Layouts {
  const ids = new Set(widgets.map((w) => w.id))
  const out: Layouts = {}
  for (const [bp, cols] of Object.entries(COLS)) {
    const items: GridItem[] = (layouts[bp] ?? [])
      .filter((it) => ids.has(it.i))
      .map((it) => ({
        ...it,
        w: Math.min(it.w, cols),
        minW: it.minW != null ? Math.min(it.minW, cols) : undefined,
      }))
    for (const inst of widgets) {
      if (items.some((it) => it.i === inst.id)) continue
      const def = WIDGETS[inst.type]
      if (!def) continue
      const w = Math.min(def.w, cols)
      const { x, y } = findSlot(items, w, def.h, cols)
      items.push({ i: inst.id, x, y, w, h: def.h, minW: Math.min(def.minW, cols), minH: def.minH })
    }
    out[bp] = items
  }
  return out
}

interface LayoutState {
  widgets: WidgetInstance[]
  layouts: Layouts
  editMode: boolean
  loaded: boolean
  load: () => Promise<void>
  commitLayout: (bp: string, layout: GridItem[]) => void
  addWidget: (type: string, config?: WidgetConfig) => void
  removeWidget: (id: string) => void
  toggleEdit: () => void
  reset: () => void
}

let saveTimer: ReturnType<typeof setTimeout> | undefined

function scheduleSave(get: () => LayoutState) {
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    const { layouts, widgets } = get()
    void api('/api/layout', {
      method: 'PUT',
      body: JSON.stringify({ layouts, widgets }),
    }).catch(() => {})
  }, 800)
}

function defaultInstances(): WidgetInstance[] {
  return DEFAULT_TYPES.map((t) => ({ id: t, type: t }))
}

export const useLayout = create<LayoutState>((set, get) => ({
  widgets: [],
  layouts: {},
  editMode: false,
  loaded: false,

  async load() {
    try {
      const data = await api<{ layouts: Layouts; widgets: WidgetInstance[] }>('/api/layout')
      if (data.widgets && data.widgets.length > 0) {
        // Drop instances whose type no longer exists, then make layouts consistent.
        const widgets = data.widgets.filter((w) => WIDGETS[w.type])
        set({ widgets, layouts: reconcileLayouts(widgets, data.layouts ?? {}), loaded: true })
        return
      }
    } catch {
      // fall through to defaults
    }
    const instances = defaultInstances()
    set({ widgets: instances, layouts: buildLayouts(instances), loaded: true })
  },

  // Persist a user-driven move/resize for one breakpoint. Called from
  // react-grid-layout's drag/resize *stop* events (not the per-render
  // onLayoutChange, which feeds an endless update loop), so we only write when
  // something actually changed.
  commitLayout(bp, layout) {
    const cur = get().layouts
    const next: Layouts = {
      ...cur,
      [bp]: layout.map((i) => ({
        i: i.i,
        x: i.x,
        y: i.y,
        w: i.w,
        h: i.h,
        minW: i.minW,
        minH: i.minH,
      })),
    }
    if (layoutSignature(next) === layoutSignature(cur)) return
    set({ layouts: next })
    scheduleSave(get)
  },

  addWidget(type, config) {
    const state = get()
    const def = WIDGETS[type]
    if (!def) return
    const inst: WidgetInstance = { id: newId(type), type, ...(config ? { config } : {}) }
    const layouts: Layouts = { ...state.layouts }
    for (const [bp, cols] of Object.entries(COLS)) {
      const items = layouts[bp] ? [...layouts[bp]] : []
      const w = Math.min(def.w, cols)
      const { x, y } = findSlot(items, w, def.h, cols)
      items.push({ i: inst.id, x, y, w, h: def.h, minW: Math.min(def.minW, cols), minH: def.minH })
      layouts[bp] = items
    }
    set({ widgets: [...state.widgets, inst], layouts })
    scheduleSave(get)
  },

  removeWidget(id) {
    const state = get()
    const widgets = state.widgets.filter((w) => w.id !== id)
    const layouts: Layouts = {}
    for (const bp of Object.keys(state.layouts)) {
      layouts[bp] = state.layouts[bp].filter((it) => it.i !== id)
    }
    set({ widgets, layouts })
    scheduleSave(get)
  },

  toggleEdit() {
    set((s) => ({ editMode: !s.editMode }))
  },

  reset() {
    const instances = defaultInstances()
    set({ widgets: instances, layouts: buildLayouts(instances) })
    scheduleSave(get)
  },
}))
