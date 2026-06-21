import { useEffect, useState } from 'react'

/**
 * Phase 0 foundation screen — verifies the Linear/Modern token system renders
 * in both themes. Replaced by routing + the real shell in Phase 1.
 */
function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  return (
    <div className="relative min-h-dvh bg-background text-foreground">
      <main className="mx-auto flex min-h-dvh max-w-3xl flex-col items-center justify-center px-6 text-center">
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          Forex Desk
        </p>
        <h1 className="mt-4 animate-fade-up bg-gradient-to-b from-foreground to-foreground/60 bg-clip-text text-5xl font-semibold tracking-tight text-transparent sm:text-7xl">
          Foundations
        </h1>
        <p className="mt-5 max-w-md text-base leading-relaxed text-muted-foreground">
          Design tokens, theming, and tooling are in place. The trader&apos;s desk is taking shape.
        </p>
        <button
          type="button"
          onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
          className="mt-8 cursor-pointer rounded-lg border border-border bg-surface px-4 py-2 text-sm shadow-inner-top transition-colors duration-200 hover:border-border-hover hover:bg-surface-hover"
        >
          Toggle theme — <span className="text-primary">{theme}</span>
        </button>
      </main>
    </div>
  )
}

export default App
