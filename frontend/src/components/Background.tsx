/**
 * Ambient layered background — the signature "deep space with light pools".
 * Four layers: base radial gradient + grid + noise + floating blurred blobs.
 * Theme-aware (all colors are tokens); blob float respects prefers-reduced-motion
 * via the global rule in index.css.
 */

const NOISE =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")"

export function Background() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-background"
    >
      {/* Layer 1 — base radial gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--bg-elevated)_0%,var(--background)_50%,var(--bg-deep)_100%)]" />

      {/* Layer 4 — 64px technical grid */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(var(--grid-line) 1px, transparent 1px), linear-gradient(90deg, var(--grid-line) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
        }}
      />

      {/* Layer 2 — noise texture */}
      <div
        className="absolute inset-0"
        style={{ opacity: 'var(--noise-opacity)', backgroundImage: NOISE }}
      />

      {/* Layer 3 — ambient light pools (reference atmosphere: cool top-left,
          warm right-center, violet accent below) */}
      <div
        className="absolute -top-40 -left-40 h-[1000px] w-[800px] animate-float-slow rounded-full blur-[150px]"
        style={{ background: 'var(--blob-1)' }}
      />
      <div
        className="absolute top-[34%] -right-40 h-[1100px] w-[760px] -translate-y-1/3 animate-float rounded-full blur-[150px]"
        style={{ background: 'var(--blob-3)' }}
      />
      <div
        className="absolute bottom-0 left-1/4 h-[700px] w-[560px] animate-float rounded-full blur-[130px]"
        style={{ background: 'var(--blob-2)' }}
      />
    </div>
  )
}
