import { CalendarDays, GraduationCap, LayoutGrid, NotebookPen, Wallet } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/cn'

const ITEMS = [
  { to: '/dashboard', label: 'Desk', icon: LayoutGrid },
  { to: '/portfolio', label: 'Portfolio', icon: Wallet },
  { to: '/journal', label: 'Journal', icon: NotebookPen },
  { to: '/calendar', label: 'Calendar', icon: CalendarDays },
  { to: '/learn', label: 'Learn', icon: GraduationCap },
]

/** Phone-first primary navigation: thumb-reachable, 44px+ targets, safe-area aware. */
export function BottomNav() {
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/90 backdrop-blur-xl md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul className="flex">
        {ITEMS.map(({ to, label, icon: Icon }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              className={({ isActive }) =>
                cn(
                  'flex min-h-[44px] flex-col items-center justify-center gap-0.5 py-1.5',
                  isActive ? 'text-primary' : 'text-muted-foreground',
                )
              }
            >
              <Icon className="h-5 w-5" aria-hidden />
              <span className="text-[10px] font-medium">{label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
