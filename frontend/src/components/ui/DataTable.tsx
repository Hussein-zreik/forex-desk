import { useRef, type ReactNode } from 'react'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useVirtualRows } from '@/hooks/useVirtualRows'
import { cn } from '@/lib/cn'

export interface Column<Row> {
  /** Stable key, also used as the mobile card label fallback. */
  key: string
  header: ReactNode
  cell: (row: Row) => ReactNode
  /** Right-align + `tabular-nums` for figures. */
  numeric?: boolean
  align?: 'left' | 'right'
  headerClassName?: string
  cellClassName?: string | ((row: Row) => string)
  /** Omit this column from the stacked mobile card view. */
  hideOnMobile?: boolean
}

export interface DataTableProps<Row> {
  columns: Column<Row>[]
  rows: Row[]
  rowKey: (row: Row) => string
  /** Trailing per-row actions (e.g. a delete button). */
  rowActions?: (row: Row) => ReactNode
  /** Accessible caption (visually hidden). */
  caption?: string
  stickyHeader?: boolean
  /** Enable fixed-height windowing on the desktop table for long lists. */
  virtual?: { rowHeight: number; threshold?: number; maxHeight?: number | string }
  className?: string
}

function alignClass<Row>(col: Column<Row>): string {
  return col.numeric || col.align === 'right' ? 'text-right' : 'text-left'
}
function cellClass<Row>(col: Column<Row>, row: Row): string {
  const extra = typeof col.cellClassName === 'function' ? col.cellClassName(row) : col.cellClassName
  return cn('p-3', alignClass(col), col.numeric && 'tabular-nums', extra)
}

/**
 * Responsive, accessible data table. Renders a real `<table>` (with `scope="col"`
 * headers and optional virtualization) at `md`+, and stacks into label/value cards
 * on small screens so it never forces horizontal scrolling. Config-driven so callers
 * declare columns once and get both layouts for free.
 */
export function DataTable<Row>(props: DataTableProps<Row>) {
  const isDesktop = useMediaQuery('(min-width: 768px)')
  return isDesktop ? <DesktopTable {...props} /> : <MobileCards {...props} />
}

function DesktopTable<Row>({
  columns,
  rows,
  rowKey,
  rowActions,
  caption,
  stickyHeader,
  virtual,
  className,
}: DataTableProps<Row>) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const colCount = columns.length + (rowActions ? 1 : 0)
  const useVirtual = !!virtual && rows.length > (virtual.threshold ?? 40)

  // Hooks must run unconditionally; the window is simply ignored when not virtualizing.
  const win = useVirtualRows(scrollRef, {
    count: rows.length,
    rowHeight: virtual?.rowHeight ?? 48,
  })
  const visible = useVirtual ? rows.slice(win.start, win.end) : rows

  const maxHeight =
    typeof virtual?.maxHeight === 'number' ? `${virtual.maxHeight}px` : virtual?.maxHeight

  return (
    <div
      ref={scrollRef}
      className={cn('overflow-auto', className)}
      style={useVirtual && maxHeight ? { maxHeight } : undefined}
    >
      <table className="w-full text-sm">
        {caption ? <caption className="sr-only">{caption}</caption> : null}
        <thead className={cn(stickyHeader && 'sticky top-0 z-10 bg-surface')}>
          <tr className="border-b border-border text-left text-xs text-muted-foreground">
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                className={cn('p-3 font-medium', alignClass(col), col.headerClassName)}
              >
                {col.header}
              </th>
            ))}
            {rowActions ? <th scope="col" className="p-3" /> : null}
          </tr>
        </thead>
        <tbody>
          {useVirtual && win.topPad > 0 ? (
            <tr aria-hidden="true" style={{ height: win.topPad }}>
              <td colSpan={colCount} />
            </tr>
          ) : null}
          {visible.map((row) => (
            <tr
              key={rowKey(row)}
              className="border-b border-border/50 last:border-0"
              style={useVirtual ? { height: virtual?.rowHeight } : undefined}
            >
              {columns.map((col) => (
                <td key={col.key} className={cellClass(col, row)}>
                  {col.cell(row)}
                </td>
              ))}
              {rowActions ? <td className="p-3 text-right">{rowActions(row)}</td> : null}
            </tr>
          ))}
          {useVirtual && win.bottomPad > 0 ? (
            <tr aria-hidden="true" style={{ height: win.bottomPad }}>
              <td colSpan={colCount} />
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  )
}

function MobileCards<Row>({ columns, rows, rowKey, rowActions }: DataTableProps<Row>) {
  const visibleCols = columns.filter((c) => !c.hideOnMobile)
  return (
    <ul className="flex flex-col gap-3 p-3">
      {rows.map((row) => (
        <li key={rowKey(row)} className="rounded-lg border border-border bg-surface/40 p-3">
          <dl className="flex flex-col gap-1.5">
            {visibleCols.map((col) => (
              <div key={col.key} className="flex items-center justify-between gap-3">
                <dt className="text-xs text-muted-foreground">{col.header}</dt>
                <dd className={cn('text-sm', col.numeric && 'tabular-nums')}>{col.cell(row)}</dd>
              </div>
            ))}
          </dl>
          {rowActions ? <div className="mt-2 flex justify-end">{rowActions(row)}</div> : null}
        </li>
      ))}
    </ul>
  )
}
