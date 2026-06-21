import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useSettings } from '@/store/useSettings'
import { ThemeToggle } from './ThemeToggle'

test('toggles the theme on click', async () => {
  useSettings.setState({ theme: 'dark' })
  render(<ThemeToggle />)
  await userEvent.click(screen.getByRole('button', { name: /toggle theme/i }))
  expect(useSettings.getState().theme).toBe('light')
})
