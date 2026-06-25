import { render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach } from 'vitest'
import { type Column, DataTable } from './DataTable'

interface Row {
  id: string
  name: string
  pnl: number
}

const ROWS: Row[] = [
  { id: '1', name: 'EUR/USD', pnl: 120 },
  { id: '2', name: 'XAU/USD', pnl: -40 },
]

const COLUMNS: Column<Row>[] = [
  { key: 'name', header: 'Symbol', cell: (r) => r.name },
  { key: 'pnl', header: 'P&L', numeric: true, cell: (r) => r.pnl },
]

function stubMatchMedia(matches: boolean) {
  vi.stubGlobal(
    'matchMedia',
    (query: string) =>
      ({
        matches,
        media: query,
        addEventListener: () => {},
        removeEventListener: () => {},
      }) as unknown as MediaQueryList,
  )
}

afterEach(() => vi.unstubAllGlobals())

describe('desktop', () => {
  beforeEach(() => stubMatchMedia(true))

  test('renders a table with scope="col" headers and numeric alignment', () => {
    render(<DataTable columns={COLUMNS} rows={ROWS} rowKey={(r) => r.id} />)
    const headers = screen.getAllByRole('columnheader')
    expect(headers[0]).toHaveTextContent('Symbol')
    expect(headers[0]).toHaveAttribute('scope', 'col')
    // numeric cell is right-aligned
    const cell = screen.getByText('120')
    expect(cell.className).toContain('text-right')
  })

  test('renders a trailing actions cell', () => {
    render(
      <DataTable
        columns={COLUMNS}
        rows={ROWS}
        rowKey={(r) => r.id}
        rowActions={(r) => <button type="button">Delete {r.name}</button>}
      />,
    )
    expect(screen.getByRole('button', { name: 'Delete EUR/USD' })).toBeInTheDocument()
  })
})

describe('mobile', () => {
  beforeEach(() => stubMatchMedia(false))

  test('stacks rows into label/value cards', () => {
    render(<DataTable columns={COLUMNS} rows={ROWS} rowKey={(r) => r.id} />)
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    const items = screen.getAllByRole('listitem')
    expect(items).toHaveLength(2)
    expect(within(items[0]).getByText('Symbol')).toBeInTheDocument()
    expect(within(items[0]).getByText('EUR/USD')).toBeInTheDocument()
  })
})
