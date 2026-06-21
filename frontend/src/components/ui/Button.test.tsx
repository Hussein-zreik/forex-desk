import { render, screen } from '@testing-library/react'
import { Button } from './Button'

test('renders its children', () => {
  render(<Button>Click me</Button>)
  expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument()
})

test('defaults to type=button', () => {
  render(<Button>Go</Button>)
  expect(screen.getByRole('button', { name: 'Go' })).toHaveAttribute('type', 'button')
})

test('honors disabled and variant', () => {
  render(
    <Button variant="secondary" disabled>
      Disabled
    </Button>,
  )
  expect(screen.getByRole('button', { name: 'Disabled' })).toBeDisabled()
})
