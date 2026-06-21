import { useEffect, useState } from 'react'
import { Background } from '@/components/Background'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'

/**
 * Phase 0 playground — verifies tokens, ambient background, and primitives in
 * both themes. Replaced by routing + the real shell in Phase 1.
 */
function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  return (
    <>
      <Background />
      <main className="mx-auto flex min-h-dvh max-w-4xl flex-col items-center justify-center gap-10 px-6 py-16 text-center">
        <div>
          <Badge>Forex Desk</Badge>
          <h1 className="mt-4 animate-fade-up bg-gradient-to-b from-foreground to-foreground/60 bg-clip-text text-5xl font-semibold tracking-tight text-transparent sm:text-7xl">
            Foundations
          </h1>
          <p className="mx-auto mt-5 max-w-md leading-relaxed text-muted-foreground">
            Design tokens, ambient lighting, motion, and primitives are in place. The trader&apos;s
            desk is taking shape.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}>
            Toggle theme — {theme}
          </Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
        </div>

        <Card spotlight className="w-full max-w-sm text-left">
          <h3 className="text-lg font-semibold tracking-tight">Spotlight Card</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Hover to see the cursor-tracking glow and multi-layer shadow.
          </p>
          <Input className="mt-4" placeholder="Search a symbol — e.g. XAU/USD" />
        </Card>
      </main>
    </>
  )
}

export default App
