import { LogOut, Menu, SlidersHorizontal, X } from 'lucide-react'
import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Clock } from '@/components/Clock'
import { SettingsMenu } from '@/components/SettingsMenu'
import { IconButton } from '@/components/ui/IconButton'
import { cn } from '@/lib/cn'
import { useAuth } from '@/store/useAuth'

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/portfolio', label: 'Portfolio' },
  { to: '/journal', label: 'Journal' },
  { to: '/learn', label: 'Learn' },
  { to: '/calendar', label: 'Calendar' },
]

function navLinkClass({ isActive }: { isActive: boolean }) {
  return cn(
    'rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-200',
    isActive
      ? 'bg-primary/15 text-primary'
      : 'text-muted-foreground hover:bg-surface hover:text-foreground',
  )
}

export function Navbar() {
  const [open, setOpen] = useState(false)
  const user = useAuth((s) => s.user)
  const logout = useAuth((s) => s.logout)

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-[1600px] items-center gap-4 px-4">
        <Link to="/dashboard" className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary text-primary-foreground shadow-cta">
            <span className="font-mono text-[11px] font-bold">FX</span>
          </span>
          <span className="text-sm font-semibold tracking-tight">Forex Desk</span>
        </Link>

        <nav className="ml-4 hidden items-center gap-1 md:flex">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.to} to={item.to} className={navLinkClass}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <Clock />
          <SettingsMenu />
          <IconButton
            className="md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </IconButton>
        </div>
      </div>

      {open && (
        <div className="border-t border-border bg-background/95 px-4 py-3 backdrop-blur-xl md:hidden">
          <nav className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={navLinkClass}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </NavLink>
            ))}
            {user && (
              <NavLink to="/settings" className={navLinkClass} onClick={() => setOpen(false)}>
                <span className="flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4" /> Options
                </span>
              </NavLink>
            )}
            {user && (
              <button
                type="button"
                onClick={() => {
                  setOpen(false)
                  logout()
                }}
                className="mt-1 flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-muted-foreground hover:bg-surface hover:text-foreground"
              >
                <LogOut className="h-4 w-4" /> Log out
              </button>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}
