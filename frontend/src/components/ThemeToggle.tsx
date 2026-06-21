import { Moon, Sun } from 'lucide-react'
import { IconButton } from '@/components/ui/IconButton'
import { useSettings } from '@/store/useSettings'

export function ThemeToggle() {
  const theme = useSettings((s) => s.theme)
  const toggleTheme = useSettings((s) => s.toggleTheme)

  return (
    <IconButton onClick={toggleTheme} aria-label="Toggle theme" title="Toggle theme">
      {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </IconButton>
  )
}
