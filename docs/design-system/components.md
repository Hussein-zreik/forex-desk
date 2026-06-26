# Component Library — forex-desk

Production-grade, reusable UI built on the **Linear/Modern** design tokens
(`src/index.css`) with **Tailwind v4**, **class-variance-authority (cva)** for
variants, and `cn()` (`src/lib/cn.ts`, clsx + tailwind-merge) for class merging.
Everything is exported from the barrel `@/components/ui`.

> **Token rule:** components style with semantic tokens only — `bg-surface`,
> `text-muted-foreground`, `text-up`/`text-down`, `border-input`, `ring`,
> `shadow-card`, `ease-expo`, … — never raw hex. This is what makes light/dark
> "just work".

---

## Architecture

Three layers, each building on the one below:

| Layer | Components | Role |
|-------|-----------|------|
| **Primitives** | `Button`, `IconButton`, `Input`, `Select`, `Badge`, `Spinner`, `Skeleton`, `Card` | Single elements; variant-driven; no data awareness |
| **Composites** | `Field`, `EmptyState`, `ErrorState`, `AsyncBoundary`, `DataTable`, `SegmentedControl`, `StatCard`, `PageHeader` | Compose primitives; own a small interaction or state concern |
| **Feature** | `WidgetFrame`, `AsyncWidget`, pages, widgets | App-specific; consume composites |

**Conventions**
- `forwardRef` + an exported `*Props` interface for every primitive.
- Variants via cva (e.g. `Button` `variant`/`size`); the variant function stays
  module-private, `VariantProps` flows into the exported props type.
- Data fetching stays in `useWidgetData` (`{ data, loading, error, refresh }`);
  components are told their state, they don't fetch.
- Code style: no semicolons, single quotes, trailing commas, 100-col.

---

## The state ladder: `AsyncBoundary`

The single most-used composite. It replaces the hand-written
`data ? … : loading ? … : null` conditionals that used to live in every widget
and page, guaranteeing consistent loading → error (with retry) → empty → data.

```tsx
const query = useWidgetData<Row[]>(() => api('/api/rows'))

<AsyncBoundary
  data={query.data}
  loading={query.loading}
  error={query.error}
  onRetry={query.refresh}
  isEmpty={(rows) => rows.length === 0}
  empty={<EmptyState title="No rows yet" />}
  skeleton={<SkeletonText lines={4} />}   // optional; defaults to a centered Spinner
>
  {(rows) => <List rows={rows} />}
</AsyncBoundary>
```

**Precedence** — while nothing has loaded: loading wins, then error. Once data
exists it stays on screen during background refreshes (stale-while-revalidate),
so a failed poll never blanks out good data.

| Prop | Type | Notes |
|------|------|-------|
| `data` | `T \| null \| undefined` | `null`/`undefined` ⇒ "not loaded yet" |
| `loading` | `boolean` | |
| `error` | `string \| null` | |
| `onRetry` | `() => void` | surfaced by the error state |
| `isEmpty` | `(data: T) => boolean` | optional emptiness test |
| `skeleton` / `empty` | `ReactNode` | override the default loading / empty views |
| `compact` | `boolean` | tighter spacing for widget bodies |
| `children` | `(data: T) => ReactNode` | render-prop, receives non-null data |

For dashboard widgets use **`AsyncWidget`** — it composes `WidgetFrame` chrome
(title, refresh, drag handle) with an `AsyncBoundary` body:

```tsx
<AsyncWidget title="Crypto" query={query} editMode={editMode} onRemove={onRemove}
  isEmpty={(d) => d.quotes.length === 0} empty={<EmptyState compact title="Waiting…" />}>
  {(d) => <Grid quotes={d.quotes} />}
</AsyncWidget>
```

---

## Forms: `Field` + `Input` / `Select`

`Field` is the accessibility unit: it generates an id, links the `<label>`,
wires `aria-describedby` to hint/error, sets `aria-invalid`, and announces errors
via `role="alert"`. The control receives the wiring through a render-prop.

```tsx
const [errors, setErrors] = useState<{ size?: string }>({})

<Field label="Size" error={errors.size}>
  {(p) => <Input {...p} type="number" value={size} onChange={(e) => setSize(e.target.value)} />}
</Field>

<Field label="Side">
  {(p) => (
    <Select {...p} value={side} onChange={(e) => setSide(e.target.value)}>
      <option value="LONG">Long</option>
      <option value="SHORT">Short</option>
    </Select>
  )}
</Field>
```

- `Input` / `Select` take `invalid?: boolean` for error styling (the `Field`
  passes it automatically). `Select` is full-width by default; pass
  `wrapperClassName="w-auto"` for inline/compact use.
- Validate on submit, set messages into state, pass to `Field error`.

---

## Tables: `DataTable`

Config-driven and **responsive**: a real `<table>` (with `scope="col"` headers,
optional virtualization) at `md`+, auto-stacking into label/value cards below
`md` so it never forces horizontal scroll. One column declaration drives both.

```tsx
const columns: Column<Position>[] = [
  { key: 'symbol', header: 'Symbol', cell: (p) => p.symbol, cellClassName: 'font-medium' },
  { key: 'pnl', header: 'P&L', numeric: true,            // numeric ⇒ right-aligned + tabular-nums
    cellClassName: (p) => (p.pnl >= 0 ? 'text-up' : 'text-down'),
    cell: (p) => fmtMoney(p.pnl) },
  { key: 'note', header: 'Note', cell: (p) => p.note, hideOnMobile: true },
]

<DataTable
  columns={columns} rows={rows} rowKey={(p) => p.id}
  caption="Open positions"
  stickyHeader
  virtual={{ rowHeight: 48, threshold: 40, maxHeight: '34rem' }}   // windowing for long lists
  rowActions={(p) => <button aria-label="Delete" onClick={() => remove(p.id)}>…</button>}
/>
```

Virtualization (via `useVirtualRows`) applies to the desktop table; the
breakpoint is chosen with `useMediaQuery('(min-width: 768px)')` so only one tree
renders.

---

## Other composites

- **`SegmentedControl<V>`** — single-select filter as an ARIA `radiogroup` with
  roving-tabindex keyboard nav (←/→/↑/↓, Home/End). Replaces ad-hoc filter button
  rows (Calendar, Learning).
  ```tsx
  <SegmentedControl label="Impact" value={f} onChange={setF}
    options={[{ value: 'all', label: 'All' }, { value: 'high', label: 'High' }]} />
  ```
- **`StatCard`** — metric card. `format="money"`, `colorByValue` (color by sign),
  `tone="up"|"down"` (force color), `size="sm"` (dense grids).
- **`PageHeader`** — `title` + optional `description` + `actions` slot.
- **`EmptyState` / `ErrorState`** — consistent placeholders; `compact` for widgets.
  `ErrorState` is `role="alert"` with an optional retry.
- **`Skeleton` / `SkeletonText`** — shimmer placeholders for content-shaped loading.

## Primitive variant reference

| Component | Variants |
|-----------|----------|
| `Button` | `variant`: primary · secondary · ghost · destructive; `size`: sm · md · lg; `loading` (spinner + `aria-busy` + disabled); `asChild` |
| `Input` | `invalid` |
| `Select` | `invalid`, `wrapperClassName` |
| `Badge` | `variant`: neutral · up · down · accent · warn |
| `Spinner` | `size`: sm · md · lg; `label` (sr-only, `role="status"`) |

---

## Best practices

1. **Reach for `AsyncBoundary`/`AsyncWidget`** for anything backed by
   `useWidgetData`. Don't hand-roll the loading/error/empty ladder, and never
   swallow errors silently — pass `error` through so users can retry.
2. **Every input lives in a `Field`.** No bare `<label>`/`<input>` pairs; that's
   how labels, hints, and error announcements stay correct.
3. **Skeleton vs spinner:** prefer a content-shaped `Skeleton` when the eventual
   layout is known (lists, cards); use `Spinner` for indeterminate/brief waits.
4. **Tables use `DataTable`**, not raw `<table>` — you get responsive stacking,
   `scope="col"`, numeric alignment, and virtualization for free.
5. **Tokens only.** No raw hex in components; rely on the semantic tokens so
   light/dark and future theming hold.
6. **Empty copy is specific and actionable** ("No open positions — add one above"),
   not "No data".
7. **Respect motion/contrast:** global `prefers-reduced-motion` and
   `focus-visible` rules already exist; don't override them.
8. **Keep data out of primitives.** Fetch in hooks/stores; pass state down.
