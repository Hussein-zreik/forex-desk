import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { useMenu } from './useMenu'

function MenuHarness() {
  const { open, toggle, setOpen, rootRef, triggerRef, surfaceProps } = useMenu({ mode: 'menu' })
  return (
    <div ref={rootRef}>
      <button ref={triggerRef} onClick={toggle} aria-expanded={open}>
        Open
      </button>
      {open && (
        <div {...surfaceProps} aria-label="Test menu">
          <button role="menuitem" tabIndex={-1} onClick={() => setOpen(false)}>
            One
          </button>
          <button role="menuitem" tabIndex={-1}>
            Two
          </button>
          <button role="menuitem" tabIndex={-1}>
            Three
          </button>
        </div>
      )}
    </div>
  )
}

describe('useMenu (menu mode)', () => {
  it('focuses the first item on open', async () => {
    render(<MenuHarness />)
    await userEvent.click(screen.getByRole('button', { name: 'Open' }))
    expect(screen.getByRole('menuitem', { name: 'One' })).toHaveFocus()
  })

  it('ArrowDown / ArrowUp rove and wrap', async () => {
    const user = userEvent.setup()
    render(<MenuHarness />)
    await user.click(screen.getByRole('button', { name: 'Open' }))

    await user.keyboard('{ArrowDown}')
    expect(screen.getByRole('menuitem', { name: 'Two' })).toHaveFocus()
    await user.keyboard('{ArrowDown}')
    expect(screen.getByRole('menuitem', { name: 'Three' })).toHaveFocus()
    await user.keyboard('{ArrowDown}') // wraps to first
    expect(screen.getByRole('menuitem', { name: 'One' })).toHaveFocus()
    await user.keyboard('{ArrowUp}') // wraps to last
    expect(screen.getByRole('menuitem', { name: 'Three' })).toHaveFocus()
  })

  it('Home / End jump to the ends', async () => {
    const user = userEvent.setup()
    render(<MenuHarness />)
    await user.click(screen.getByRole('button', { name: 'Open' }))
    await user.keyboard('{End}')
    expect(screen.getByRole('menuitem', { name: 'Three' })).toHaveFocus()
    await user.keyboard('{Home}')
    expect(screen.getByRole('menuitem', { name: 'One' })).toHaveFocus()
  })

  it('Escape closes and returns focus to the trigger', async () => {
    const user = userEvent.setup()
    render(<MenuHarness />)
    const trigger = screen.getByRole('button', { name: 'Open' })
    await user.click(trigger)
    expect(screen.getByRole('menuitem', { name: 'One' })).toBeInTheDocument()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('menuitem')).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
  })

  it('Tab traps focus within the items (cycles instead of leaving)', async () => {
    const user = userEvent.setup()
    render(<MenuHarness />)
    await user.click(screen.getByRole('button', { name: 'Open' }))
    await user.keyboard('{Tab}')
    expect(screen.getByRole('menuitem', { name: 'Two' })).toHaveFocus()
    await user.keyboard('{Shift>}{Tab}{/Shift}')
    expect(screen.getByRole('menuitem', { name: 'One' })).toHaveFocus()
  })
})
