import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SegmentedControl } from './SegmentedControl'

const OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'high', label: 'High' },
  { value: 'low', label: 'Low' },
]

test('renders an accessible radiogroup with the active option checked', () => {
  render(<SegmentedControl label="Impact" options={OPTIONS} value="all" onChange={() => {}} />)
  expect(screen.getByRole('radiogroup', { name: 'Impact' })).toBeInTheDocument()
  expect(screen.getByRole('radio', { name: 'All' })).toHaveAttribute('aria-checked', 'true')
})

test('selects on click', async () => {
  const onChange = vi.fn()
  render(<SegmentedControl label="Impact" options={OPTIONS} value="all" onChange={onChange} />)
  await userEvent.click(screen.getByRole('radio', { name: 'High' }))
  expect(onChange).toHaveBeenCalledWith('high')
})

test('moves selection with arrow keys', async () => {
  const onChange = vi.fn()
  render(<SegmentedControl label="Impact" options={OPTIONS} value="all" onChange={onChange} />)
  screen.getByRole('radio', { name: 'All' }).focus()
  await userEvent.keyboard('{ArrowRight}')
  expect(onChange).toHaveBeenCalledWith('high')
})
