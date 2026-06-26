import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Inbox } from 'lucide-react'
import { Badge } from './Badge'
import { EmptyState } from './EmptyState'
import { ErrorState } from './ErrorState'
import { Select } from './Select'
import { StatCard } from './StatCard'

test('EmptyState renders title, description and action', () => {
  render(
    <EmptyState
      icon={Inbox}
      title="No positions"
      description="Add one above"
      action={<button type="button">Add</button>}
    />,
  )
  expect(screen.getByText('No positions')).toBeInTheDocument()
  expect(screen.getByText('Add one above')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Add' })).toBeInTheDocument()
})

test('ErrorState announces via role=alert and retries', async () => {
  const onRetry = vi.fn()
  render(<ErrorState message="Failed" onRetry={onRetry} />)
  expect(screen.getByRole('alert')).toHaveTextContent('Failed')
  await userEvent.click(screen.getByRole('button', { name: 'Retry' }))
  expect(onRetry).toHaveBeenCalledTimes(1)
})

test('Select marks itself invalid for aria', () => {
  render(
    <Select invalid aria-label="Symbol">
      <option value="a">A</option>
    </Select>,
  )
  expect(screen.getByLabelText('Symbol')).toHaveAttribute('aria-invalid', 'true')
})

test('StatCard formats money and colors by sign', () => {
  render(<StatCard label="P&L" value={-1234} format="money" colorByValue />)
  const value = screen.getByText('-$1,234')
  expect(value.className).toContain('text-down')
})

test('StatCard tone overrides sign coloring', () => {
  render(<StatCard label="Avg Win" value={500} format="money" tone="up" />)
  expect(screen.getByText('$500').className).toContain('text-up')
})

test('Badge applies its variant', () => {
  render(<Badge variant="up">Long</Badge>)
  expect(screen.getByText('Long').className).toContain('text-up')
})
