import { MailWarning, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { useAuth } from '@/store/useAuth'

/** Soft nag for unverified accounts; adapts when the server can't send email. */
export function VerifyEmailBanner() {
  const user = useAuth((s) => s.user)
  const [dismissed, setDismissed] = useState(false)
  const [emailConfigured, setEmailConfigured] = useState<boolean | null>(null)
  const [resent, setResent] = useState(false)

  const show = !!user && user.email_verified === false && !dismissed

  useEffect(() => {
    if (!show || emailConfigured !== null) return
    api<{ email_configured: boolean }>('/api/auth/config')
      .then((c) => setEmailConfigured(c.email_configured))
      .catch(() => setEmailConfigured(false))
  }, [show, emailConfigured])

  if (!show) return null

  async function resend() {
    try {
      await api('/api/auth/resend-verification', { method: 'POST' })
      setResent(true)
    } catch {
      /* rate-limited or offline — keep the banner as is */
    }
  }

  return (
    <div
      role="status"
      className="flex items-center gap-2.5 border-b border-warning/30 bg-warning/10 px-4 py-2 text-xs text-foreground"
    >
      <MailWarning className="h-4 w-4 shrink-0 text-warning" aria-hidden />
      {emailConfigured === false ? (
        <span className="text-muted-foreground">
          Your email isn&rsquo;t verified — email delivery isn&rsquo;t configured on this server,
          so verification is currently unavailable.
        </span>
      ) : resent ? (
        <span>Verification email sent — check your inbox.</span>
      ) : (
        <span>
          Please verify your email address.{' '}
          <button
            type="button"
            onClick={resend}
            className="cursor-pointer font-medium text-primary hover:text-accent-bright"
          >
            Resend link
          </button>
        </span>
      )}
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
        className="ml-auto cursor-pointer rounded p-1 text-muted-foreground hover:text-foreground"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}
