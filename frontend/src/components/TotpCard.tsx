import { ShieldCheck, ShieldOff } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'
import { api } from '@/lib/api'
import { useAuth } from '@/store/useAuth'

interface TotpSetup {
  secret: string
  otpauth_url: string
}

function CodeInput({
  value,
  onChange,
  label,
}: {
  value: string
  onChange: (v: string) => void
  label: string
}) {
  return (
    <Field label={label}>
      {(p) => (
        <Input
          {...p}
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]*"
          maxLength={6}
          required
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="123456"
          className="w-40 text-center font-mono tracking-[0.3em]"
        />
      )}
    </Field>
  )
}

/** Two-factor authentication management (enroll via QR, code-confirmed disable). */
export function TotpCard() {
  const user = useAuth((s) => s.user)
  const loadMe = useAuth((s) => s.loadMe)

  const [setup, setSetup] = useState<TotpSetup | null>(null)
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<string | null>(null)

  const enabled = user?.totp_enabled === true

  async function beginSetup() {
    setBusy(true)
    setError(null)
    setDone(null)
    try {
      setSetup(await api<TotpSetup>('/api/auth/totp/setup', { method: 'POST' }))
      setCode('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start 2FA setup')
    } finally {
      setBusy(false)
    }
  }

  async function confirm(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await api('/api/auth/totp/enable', { method: 'POST', body: JSON.stringify({ code }) })
      await loadMe()
      setSetup(null)
      setCode('')
      setDone('Two-factor authentication is on. You’ll be asked for a code at every sign-in.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'That code didn’t work')
    } finally {
      setBusy(false)
    }
  }

  async function disable(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await api('/api/auth/totp/disable', { method: 'POST', body: JSON.stringify({ code }) })
      await loadMe()
      setCode('')
      setDone('Two-factor authentication is off.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'That code didn’t work')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <div className="flex items-center gap-3">
        {enabled ? (
          <ShieldCheck className="h-5 w-5 text-up" aria-hidden />
        ) : (
          <ShieldOff className="h-5 w-5 text-muted-foreground" aria-hidden />
        )}
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-medium">Two-factor authentication (TOTP)</h3>
          <p className="text-xs text-muted-foreground">
            Codes from an authenticator app such as Google Authenticator, Aegis or 1Password.
          </p>
        </div>
        <Badge className={enabled ? 'border-up/40 text-up' : ''}>{enabled ? 'On' : 'Off'}</Badge>
      </div>

      {done && (
        <p role="status" className="mt-4 rounded-lg bg-up/10 px-3 py-2 text-sm text-up">
          {done}
        </p>
      )}
      {error && (
        <p role="alert" className="mt-4 text-sm text-destructive">
          {error}
        </p>
      )}

      {!enabled && !setup && (
        <Button className="mt-5" loading={busy} onClick={beginSetup}>
          Set up 2FA
        </Button>
      )}

      {!enabled && setup && (
        <form onSubmit={confirm} className="mt-5 space-y-4">
          <p className="text-sm text-muted-foreground">
            1. Scan this QR code with your authenticator app:
          </p>
          <div className="w-fit rounded-xl bg-white p-3">
            <QRCodeSVG value={setup.otpauth_url} size={168} marginSize={0} />
          </div>
          <p className="text-xs text-muted-foreground">
            Can&rsquo;t scan? Enter this key manually:{' '}
            <code className="rounded bg-surface px-1.5 py-0.5 font-mono text-[11px] break-all">
              {setup.secret}
            </code>
          </p>
          <p className="text-sm text-muted-foreground">2. Enter the code it shows:</p>
          <CodeInput value={code} onChange={setCode} label="Authentication code" />
          <div className="flex gap-2">
            <Button type="submit" loading={busy}>
              Turn on 2FA
            </Button>
            <Button type="button" variant="secondary" onClick={() => setSetup(null)}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      {enabled && (
        <form onSubmit={disable} className="mt-5 space-y-4">
          <p className="text-sm text-muted-foreground">
            To turn 2FA off, confirm with a current code from your app.
          </p>
          <CodeInput value={code} onChange={setCode} label="Authentication code" />
          <Button type="submit" variant="secondary" loading={busy}>
            Turn off 2FA
          </Button>
        </form>
      )}
    </div>
  )
}
