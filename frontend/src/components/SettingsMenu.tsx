import {
  Bell,
  LifeBuoy,
  Lock,
  LogOut,
  Moon,
  Settings2,
  SlidersHorizontal,
  Sun,
  UserRound,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { cn } from '@/lib/cn'
import { useAuth } from '@/store/useAuth'
import { useSettings } from '@/store/useSettings'

const SECTIONS = [
  { to: '/settings#account', label: 'Account & Profile', icon: UserRound },
  { to: '/settings#general', label: 'General', icon: Settings2 },
  { to: '/settings#privacy', label: 'Privacy & Security', icon: Lock },
  { to: '/settings#notifications', label: 'Notifications', icon: Bell },
  { to: '/settings#help', label: 'Help & Support', icon: LifeBuoy },
]

const itemClass =
  'flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-surface'

/** Header options menu: settings sections, theme switch and sign-out in one place. */
export function SettingsMenu() {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  const user = useAuth((s) => s.user)
  const logout = useAuth((s) => s.logout)
  const theme = useSettings((s) => s.theme)
  const toggleTheme = useSettings((s) => s.toggleTheme)

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return
    function onPointerDown(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Options"
        title="Options"
        className={cn(
          'inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg',
          'transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none',
          open
            ? 'bg-primary/15 text-primary'
            : 'text-muted-foreground hover:bg-surface hover:text-foreground',
        )}
      >
        <SlidersHorizontal className="h-4 w-4" />
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Options"
          className="absolute right-0 z-50 mt-2 w-64 rounded-xl border border-border bg-background/95 p-2 shadow-xl backdrop-blur-xl"
        >
          {user && (
            <p className="truncate px-3 pt-1 pb-2 text-xs text-muted-foreground">{user.email}</p>
          )}

          {SECTIONS.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to} role="menuitem" className={itemClass} onClick={() => setOpen(false)}>
              <Icon className="h-4 w-4 text-muted-foreground" aria-hidden />
              {label}
            </Link>
          ))}

          <hr className="my-2 border-border" />

          <button type="button" role="menuitem" className={itemClass} onClick={toggleTheme}>
            {theme === 'dark' ? (
              <Sun className="h-4 w-4 text-muted-foreground" aria-hidden />
            ) : (
              <Moon className="h-4 w-4 text-muted-foreground" aria-hidden />
            )}
            {theme === 'dark' ? 'Light mode' : 'Dark mode'}
          </button>

          <button
            type="button"
            role="menuitem"
            className={cn(itemClass, 'text-destructive hover:text-destructive')}
            onClick={() => {
              setOpen(false)
              logout()
              navigate('/login')
            }}
          >
            <LogOut className="h-4 w-4" aria-hidden />
            Log out
          </button>
        </div>
      )}
    </div>
  )
}
