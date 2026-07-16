import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Background } from '@/components/Background'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Field } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'
import { api } from '@/lib/api'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await api('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      })
      setSent(true)
    } catch {
      setError('Something went wrong — please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-dvh items-center justify-center px-6">
      <Background />
      <Card className="w-full max-w-sm animate-scale-in">
        <Badge>Forex Desk</Badge>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight">Reset your password</h1>
        {sent ? (
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            If an account exists for <span className="text-foreground">{email}</span>, a reset
            link is on its way. Check your inbox (and spam) — the link is valid for 1 hour.
          </p>
        ) : (
          <>
            <p className="mt-1 text-sm text-muted-foreground">
              Enter your email and we&rsquo;ll send you a reset link.
            </p>
            <form onSubmit={onSubmit} className="mt-6 space-y-4">
              <Field label="Email">
                {(p) => (
                  <Input
                    {...p}
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                  />
                )}
              </Field>
              {error && (
                <p role="alert" className="text-sm text-destructive">
                  {error}
                </p>
              )}
              <Button type="submit" size="lg" loading={loading} className="w-full">
                Send reset link
              </Button>
            </form>
          </>
        )}
        <p className="mt-5 text-center text-sm text-muted-foreground">
          Remembered it?{' '}
          <Link to="/login" className="text-primary hover:text-accent-bright">
            Sign in
          </Link>
        </p>
      </Card>
    </div>
  )
}
