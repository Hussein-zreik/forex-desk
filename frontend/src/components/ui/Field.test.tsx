import { render, screen } from '@testing-library/react'
import { Field } from './Field'
import { Input } from './Input'

test('links the label to the control via a generated id', () => {
  render(<Field label="Email">{(p) => <Input {...p} placeholder="you@x.com" />}</Field>)
  const input = screen.getByLabelText('Email')
  expect(input).toBeInTheDocument()
  expect(input).toHaveAttribute('id')
})

test('wires error state to aria-invalid, role=alert, and aria-describedby', () => {
  render(
    <Field label="Size" error="Too small">
      {(p) => <Input {...p} />}
    </Field>,
  )
  const input = screen.getByLabelText('Size')
  const alert = screen.getByRole('alert')
  expect(alert).toHaveTextContent('Too small')
  expect(input).toHaveAttribute('aria-invalid', 'true')
  expect(input.getAttribute('aria-describedby')).toBe(alert.id)
})

test('shows hint text when there is no error', () => {
  render(
    <Field label="Level" hint="Price to alert at">
      {(p) => <Input {...p} />}
    </Field>,
  )
  expect(screen.getByText('Price to alert at')).toBeInTheDocument()
  expect(screen.queryByRole('alert')).not.toBeInTheDocument()
})
