import { Link } from 'react-router-dom'

/** App-wide footer: legal links + the standing not-investment-advice line. */
export function Footer() {
  return (
    <footer className="relative border-t border-border px-5 py-6">
      <div className="mx-auto flex max-w-[1600px] flex-col items-center justify-between gap-3 text-center sm:flex-row sm:text-left">
        <p className="max-w-xl font-mono text-[11px] leading-relaxed text-muted-foreground">
          Market data and model signals are indicative only — not investment advice. Trading
          foreign exchange and commodities carries significant risk of loss.
        </p>
        <nav className="flex items-center gap-4 font-mono text-[11px]">
          <Link to="/disclaimer" className="text-muted-foreground hover:text-primary">
            Risk disclaimer
          </Link>
          <Link to="/terms" className="text-muted-foreground hover:text-primary">
            Terms
          </Link>
          <Link to="/privacy" className="text-muted-foreground hover:text-primary">
            Privacy
          </Link>
          <span className="text-muted-foreground">© 2026 Forex Desk</span>
        </nav>
      </div>
    </footer>
  )
}
