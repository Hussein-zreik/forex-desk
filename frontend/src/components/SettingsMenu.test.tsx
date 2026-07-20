import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuth } from '@/store/useAuth'
import { useSettings } from '@/store/useSettings'
import { SettingsMenu } from './SettingsMenu'

vi.mock('@/lib/api', () => ({
  api: vi.fn(),
  setAuthToken: vi.fn(),
}))

function renderMenu() {
  return render(
    <MemoryRouter>
      <SettingsMenu />
    </MemoryRouter>,
  )
}

describe('SettingsMenu', () => {
  beforeEach(() => {
    useSettings.setState({ theme: 'dark' })
    useAuth.setState({
      token: 't',
      user: { id: '1', email: 'menu@test.dev', theme: 'dark' },
    })
  })

  it('opens with all five sections, theme switch and log out', async () => {
    renderMenu()
    await userEvent.click(screen.getByRole('button', { name: 'Options' }))

    for (const label of [
      'Account & Profile',
      'General',
      'Privacy & Security',
      'Notifications',
      'Help & Support',
    ]) {
      expect(screen.getByRole('menuitem', { name: label })).toBeInTheDocument()
    }
    expect(screen.getByRole('menuitem', { name: /Light mode/ })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: /Log out/ })).toBeInTheDocument()
    expect(screen.getByText('menu@test.dev')).toBeInTheDocument()
  })

  it('toggles the theme from the menu', async () => {
    renderMenu()
    await userEvent.click(screen.getByRole('button', { name: 'Options' }))
    await userEvent.click(screen.getByRole('menuitem', { name: /Light mode/ }))
    expect(useSettings.getState().theme).toBe('light')
    // Menu stays open and now offers the way back.
    expect(screen.getByRole('menuitem', { name: /Dark mode/ })).toBeInTheDocument()
  })

  it('logs out from the menu', async () => {
    renderMenu()
    await userEvent.click(screen.getByRole('button', { name: 'Options' }))
    await userEvent.click(screen.getByRole('menuitem', { name: /Log out/ }))
    expect(useAuth.getState().token).toBeNull()
    expect(useAuth.getState().user).toBeNull()
  })

  it('closes on Escape', async () => {
    renderMenu()
    await userEvent.click(screen.getByRole('button', { name: 'Options' }))
    expect(screen.getByRole('menu')).toBeInTheDocument()
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })
})
