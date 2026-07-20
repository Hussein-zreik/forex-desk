import { Send } from 'lucide-react'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

interface TelegramStatus {
  configured: boolean
  linked: boolean
}

/** Compact Telegram link/unlink row (hidden while the server has no bot). */
export function TelegramLink() {
  const [status, setStatus] = useState<TelegramStatus | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    api<TelegramStatus>('/api/telegram/status')
      .then(setStatus)
      .catch(() => {})
  }, [])

  if (!status?.configured) return null

  async function link() {
    setBusy(true)
    try {
      const { link } = await api<{ link: string }>('/api/telegram/link', { method: 'POST' })
      window.open(link, '_blank', 'noopener')
      // Optimistic: the user completes /start in Telegram; refresh shortly after.
      setTimeout(() => {
        api<TelegramStatus>('/api/telegram/status').then(setStatus).catch(() => {})
      }, 8000)
    } finally {
      setBusy(false)
    }
  }

  async function unlink() {
    await api('/api/telegram/link', { method: 'DELETE' })
    setStatus({ configured: true, linked: false })
  }

  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-surface px-2 py-1.5 text-[11px]">
      <Send className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
      {status.linked ? (
        <>
          <span className="text-muted-foreground">Telegram linked — alerts DM you.</span>
          <button
            type="button"
            onClick={unlink}
            className="no-drag ml-auto cursor-pointer text-muted-foreground hover:text-destructive"
          >
            Unlink
          </button>
        </>
      ) : (
        <>
          <span className="text-muted-foreground">Get alerts in Telegram.</span>
          <button
            type="button"
            onClick={link}
            disabled={busy}
            className="no-drag ml-auto cursor-pointer font-medium text-primary hover:text-accent-bright disabled:opacity-50"
          >
            Link now
          </button>
        </>
      )}
    </div>
  )
}
