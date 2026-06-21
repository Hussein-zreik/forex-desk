import { create } from 'zustand'
import { api } from '@/lib/api'
import { WIDGETS } from '@/pages/Dashboard/widgets/registry'

export interface WidgetInstance {
  id: string
  type: string
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

function buildLayouts(instances: WidgetInstance[]): Layouts {
  const layouts: Layouts = {}
  for (const [bp, cols] of Object.entries(COLS)) {
    let x = 0
    let y = 0
    let rowH = 0
    layouts[bp] = instances.map((inst) => {
      const def = WIDGETS[inst.type]
      const w = Math.min(def.w, cols)
      if (x + w > cols) {
        x = 0
        y += rowH
        rowH = 0
      }
      const item: GridItem = { i: inst.id, x, y, w, h: def.h, minW: def.minW, minH: def.minH }
      x += w
      rowH = Math.max(rowH, def.h)
      return item
    })
  }
  return layouts
}

interface LayoutState {
  widgets: WidgetInstance[]
  layouts: Layouts
  editMode: boolean
  loaded: boolean
  load: () => Promise<void>
  setLayouts: (layouts: Layouts) => void
  addWidget: (type: string) => void
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
        set({ widgets: data.widgets, layouts: data.layouts ?? {}, loaded: true })
        return
      }
    } catch {
      // fall through to defaults
    }
    const instances = defaultInstances()
    set({ widgets: instances, layouts: buildLayouts(instances), loaded: true })
  },

  setLayouts(layouts) {
    set({ layouts })
    scheduleSave(get)
  },

  addWidget(type) {
    const state = get()
    if (state.widgets.some((w) => w.type === type)) return
    const def = WIDGETS[type]
    if (!def) return
    const inst: WidgetInstance = { id: type, type }
    const layouts: Layouts = { ...state.layouts }
    for (const [bp, cols] of Object.entries(COLS)) {
      const items = layouts[bp] ? [...layouts[bp]] : []
      const maxY = items.reduce((m, it) => Math.max(m, it.y + it.h), 0)
      items.push({
        i: inst.id,
        x: 0,
        y: maxY,
        w: Math.min(def.w, cols),
        h: def.h,
        minW: def.minW,
        minH: def.minH,
      })
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
