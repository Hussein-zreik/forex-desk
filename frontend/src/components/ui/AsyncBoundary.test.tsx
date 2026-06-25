import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AsyncBoundary } from './AsyncBoundary'

test('shows a loading indicator when nothing has loaded yet', () => {
  render(
    <AsyncBoundary data={null} loading error={null}>
      {(d: string) => <p>{d}</p>}
    </AsyncBoundary>,
  )
  expect(screen.getByRole('status')).toBeInTheDocument()
})

test('shows the error with a working retry when there is no data', async () => {
  const onRetry = vi.fn()
  render(
    <AsyncBoundary data={null} loading={false} error="Boom" onRetry={onRetry}>
      {(d: string) => <p>{d}</p>}
    </AsyncBoundary>,
  )
  expect(screen.getByRole('alert')).toHaveTextContent('Boom')
  await userEvent.click(screen.getByRole('button', { name: 'Retry' }))
  expect(onRetry).toHaveBeenCalledTimes(1)
})

test('renders the empty state when loaded data is empty', () => {
  render(
    <AsyncBoundary
      data={[] as string[]}
      loading={false}
      error={null}
      isEmpty={(d) => d.length === 0}
      empty={<p>Nothing here</p>}
    >
      {(d) => <p>{d.join(',')}</p>}
    </AsyncBoundary>,
  )
  expect(screen.getByText('Nothing here')).toBeInTheDocument()
})

test('renders children once data is available', () => {
  render(
    <AsyncBoundary data="hello" loading={false} error={null}>
      {(d) => <p>{d}</p>}
    </AsyncBoundary>,
  )
  expect(screen.getByText('hello')).toBeInTheDocument()
})

test('keeps showing data during a background refresh (stale-while-revalidate)', () => {
  render(
    <AsyncBoundary data="cached" loading error="late failure">
      {(d) => <p>{d}</p>}
    </AsyncBoundary>,
  )
  expect(screen.getByText('cached')).toBeInTheDocument()
  expect(screen.queryByRole('status')).not.toBeInTheDocument()
})
