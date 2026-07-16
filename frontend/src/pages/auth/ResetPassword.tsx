import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Background } from '@/components/Background'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Field } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'
import { api, ApiError } from '@/lib/api'

export default function ResetPassword() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const token = params.get('token') ?? ''

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    setLoading(true)
    try {
      await api('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, new_password: password }),
      })
      navigate('/login', { replace: true })
    } catch (err) {
      setError(
        err instanceof ApiError
          ? 'This reset link is invalid or has expired — request a new one.'
          : 'Something went wrong — please try again.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-dvh items-center justify-center px-6">
      <Background />
      <Card className="w-full max-w-sm animate-scale-in">
        <Badge>Forex Desk</Badge>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight">Choose a new password</h1>
        {!token ? (
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            This page needs the link from your reset email.{' '}
            <Link to="/forgot-password" className="text-primary hover:text-accent-bright">
              Request a new link
            </Link>
            .
          </p>
        ) : (
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <Field label="New password">
              {(p) => (
                <Input
                  {...p}
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              )}
            </Field>
            <Field label="Confirm password">
              {(p) => (
                <Input
                  {...p}
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="••••••••"
                />
              )}
            </Field>
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            <Button type="submit" size="lg" loading={loading} className="w-full">
              Set new password
            </Button>
          </form>
        )}
      </Card>
    </div>
  )
}
