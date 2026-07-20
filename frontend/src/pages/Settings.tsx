import {
  Bell,
  BookOpen,
  Bug,
  ExternalLink,
  LifeBuoy,
  Lock,
  Mail,
  Settings2,
  UserRound,
  Volume2,
} from 'lucide-react'
import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { TelegramLink } from '@/components/TelegramLink'
import { TotpCard } from '@/components/TotpCard'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Field } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { api } from '@/lib/api'
import { playAlertSound } from '@/lib/sound'
import { useAuth } from '@/store/useAuth'
import { useSettings } from '@/store/useSettings'

const REPO_ISSUES = 'https://github.com/Hussein-zreik/forex-desk/issues/new'
const SUPPORT_EMAIL = 'support@forexdesk.app' // update when the domain lands

function Section({
  id,
  icon,
  title,
  blurb,
  children,
}: {
  id: string
  icon: ReactNode
  title: string
  blurb: string
  children: ReactNode
}) {
  return (
    <Card id={id} className="scroll-mt-24 p-6">
      <div className="flex items-center gap-2.5">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">
          {icon}
        </span>
        <div>
          <h2 className="text-base font-semibold tracking-tight">{title}</h2>
          <p className="text-xs text-muted-foreground">{blurb}</p>
        </div>
      </div>
      <div className="mt-5 space-y-5">{children}</div>
    </Card>
  )
}

function Row({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: ReactNode
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
      {children}
    </div>
  )
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ${
        checked ? 'bg-primary' : 'border border-border bg-surface'
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${
          checked ? 'translate-x-[22px]' : 'translate-x-0.5'
        }`}
      />
    </button>
  )
}

function ChangePasswordForm() {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setMsg(null)
    if (next !== confirm) {
      setMsg({ ok: false, text: 'New passwords don’t match.' })
      return
    }
    setBusy(true)
    try {
      await api('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ current_password: current, new_password: next }),
      })
      setCurrent('')
      setNext('')
      setConfirm('')
      setMsg({ ok: true, text: 'Password updated.' })
    } catch (err) {
      setMsg({ ok: false, text: err instanceof Error ? err.message : 'Could not update password' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-sm space-y-3">
      <Field label="Current password">
        {(p) => (
          <Input
            {...p}
            type="password"
            autoComplete="current-password"
            required
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
          />
        )}
      </Field>
      <Field label="New password">
        {(p) => (
          <Input
            {...p}
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={next}
            onChange={(e) => setNext(e.target.value)}
          />
        )}
      </Field>
      <Field label="Confirm new password">
        {(p) => (
          <Input
            {...p}
            type="password"
            autoComplete="new-password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        )}
      </Field>
      {msg && (
        <p role={msg.ok ? 'status' : 'alert'} className={`text-sm ${msg.ok ? 'text-up' : 'text-destructive'}`}>
          {msg.text}
        </p>
      )}
      <Button type="submit" loading={busy}>
        Change password
      </Button>
    </form>
  )
}

export default function Settings() {
  const navigate = useNavigate()
  const { hash } = useLocation()
  const user = useAuth((s) => s.user)
  const logout = useAuth((s) => s.logout)

  // SPA routers don't scroll to #anchors on their own.
  useEffect(() => {
    if (!hash) return
    document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [hash])

  const theme = useSettings((s) => s.theme)
  const setTheme = useSettings((s) => s.setTheme)
  const clockDisplay = useSettings((s) => s.clockDisplay)
  const setClockDisplay = useSettings((s) => s.setClockDisplay)
  const soundEnabled = useSettings((s) => s.soundEnabled)
  const toggleSound = useSettings((s) => s.toggleSound)
  const soundPattern = useSettings((s) => s.soundPattern)
  const setSoundPattern = useSettings((s) => s.setSoundPattern)
  const shareErrorReports = useSettings((s) => s.shareErrorReports)
  const setShareErrorReports = useSettings((s) => s.setShareErrorReports)

  const [resent, setResent] = useState(false)

  async function resendVerification() {
    try {
      await api('/api/auth/resend-verification', { method: 'POST' })
      setResent(true)
    } catch {
      // rate-limited or transient — the banner flow also covers this
    }
  }

  function switchAccount() {
    logout()
    navigate('/login')
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Options</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Everything about your account, appearance, security and notifications.
        </p>
      </div>

      <Section
        id="account"
        icon={<UserRound className="h-4 w-4" />}
        title="Account & Profile"
        blurb="Your identity on Forex Desk."
      >
        <Row label="Email" hint={user?.email ?? '—'}>
          {user?.email_verified ? (
            <Badge className="border-up/40 text-up">Verified</Badge>
          ) : resent ? (
            <span className="text-xs text-muted-foreground">Verification email sent</span>
          ) : (
            <Button size="sm" variant="secondary" onClick={resendVerification}>
              Verify email
            </Button>
          )}
        </Row>
        <div>
          <p className="mb-2 text-sm font-medium">Change password</p>
          <ChangePasswordForm />
        </div>
        <Row label="Switch account" hint="Sign out here, then sign in as someone else.">
          <Button size="sm" variant="secondary" onClick={switchAccount}>
            Switch account
          </Button>
        </Row>
      </Section>

      <Section
        id="general"
        icon={<Settings2 className="h-4 w-4" />}
        title="General"
        blurb="Appearance, clock and language."
      >
        <Row label="Appearance">
          <SegmentedControl
            size="sm"
            label="Theme"
            value={theme}
            onChange={setTheme}
            options={[
              { value: 'light', label: 'Light' },
              { value: 'dark', label: 'Dark' },
            ]}
          />
        </Row>
        <Row label="Header clock" hint="Trading desks often run on UTC.">
          <SegmentedControl
            size="sm"
            label="Clock display"
            value={clockDisplay}
            onChange={setClockDisplay}
            options={[
              { value: 'local', label: 'Local time' },
              { value: 'utc', label: 'UTC' },
            ]}
          />
        </Row>
        <Row label="Language" hint="More languages are on the way.">
          <Badge>English</Badge>
        </Row>
      </Section>

      <Section
        id="privacy"
        icon={<Lock className="h-4 w-4" />}
        title="Privacy & Security"
        blurb="Sign-in protection and what leaves your browser."
      >
        <TotpCard />
        <hr className="border-border" />
        <Row
          label="Share anonymous error reports"
          hint="Helps fix crashes. Never includes personal data. Applies on next page load."
        >
          <Toggle
            checked={shareErrorReports}
            onChange={setShareErrorReports}
            label="Share anonymous error reports"
          />
        </Row>
        <Row label="Sessions" hint="You’re signed in on this device. Signing out ends it.">
          <Button size="sm" variant="secondary" onClick={switchAccount}>
            Sign out
          </Button>
        </Row>
        <p className="text-xs text-muted-foreground">
          What we store and why:{' '}
          <Link to="/privacy" className="text-primary hover:text-accent-bright">
            Privacy policy
          </Link>
        </p>
      </Section>

      <Section
        id="notifications"
        icon={<Bell className="h-4 w-4" />}
        title="Notifications"
        blurb="How alert hits reach you."
      >
        <Row label="Alert sound" hint="Chime when a price alert hits while the desk is open.">
          <Toggle checked={soundEnabled} onChange={() => toggleSound()} label="Alert sound" />
        </Row>
        <Row label="Sound pattern">
          <div className="flex items-center gap-2">
            <SegmentedControl
              size="sm"
              label="Sound pattern"
              value={soundPattern}
              onChange={setSoundPattern}
              options={[
                { value: 'chime', label: 'Chime' },
                { value: 'pulse', label: 'Pulse' },
                { value: 'beep', label: 'Beep' },
              ]}
            />
            <Button
              size="sm"
              variant="secondary"
              onClick={() => playAlertSound(soundPattern)}
              aria-label="Test sound"
            >
              <Volume2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </Row>
        <TelegramLink />
        <p className="flex items-start gap-2 text-xs text-muted-foreground">
          <Mail className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          Email delivery is chosen per alert (the envelope icon when creating one) and needs a
          verified email address.
        </p>
      </Section>

      <Section
        id="help"
        icon={<LifeBuoy className="h-4 w-4" />}
        title="Help & Support"
        blurb="Guides, bug reports and a human to talk to."
      >
        <Row label="User guide" hint="Trading concepts and how each widget works.">
          <Button asChild size="sm" variant="secondary">
            <Link to="/learn">
              <BookOpen className="mr-1.5 h-3.5 w-3.5" /> Open Learn
            </Link>
          </Button>
        </Row>
        <Row label="Report a bug" hint="Something broken or weird? Tell us on GitHub.">
          <Button asChild size="sm" variant="secondary">
            <a href={REPO_ISSUES} target="_blank" rel="noreferrer">
              <Bug className="mr-1.5 h-3.5 w-3.5" /> New issue
              <ExternalLink className="ml-1.5 h-3 w-3" />
            </a>
          </Button>
        </Row>
        <Row label="Contact support" hint={SUPPORT_EMAIL}>
          <Button asChild size="sm" variant="secondary">
            <a href={`mailto:${SUPPORT_EMAIL}`}>
              <Mail className="mr-1.5 h-3.5 w-3.5" /> Email us
            </a>
          </Button>
        </Row>
        <p className="text-xs text-muted-foreground">
          Legal:{' '}
          <Link to="/terms" className="text-primary hover:text-accent-bright">
            Terms
          </Link>
          {' · '}
          <Link to="/privacy" className="text-primary hover:text-accent-bright">
            Privacy
          </Link>
          {' · '}
          <Link to="/disclaimer" className="text-primary hover:text-accent-bright">
            Risk disclaimer
          </Link>
        </p>
      </Section>
    </div>
  )
}
