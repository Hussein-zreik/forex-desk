import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Background } from '@/components/Background'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Field } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'
import { useAuth } from '@/store/useAuth'

export function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  const navigate = useNavigate()
  const login = useAuth((s) => s.login)
  const verifyTotp = useAuth((s) => s.verifyTotp)
  const register = useAuth((s) => s.register)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  // Set when the server answered the password step with a 2FA challenge.
  const [challenge, setChallenge] = useState<string | null>(null)
  const [code, setCode] = useState('')

  const isLogin = mode === 'login'

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      if (isLogin) {
        const result = await login(email, password)
        if (result.totpRequired && result.challengeToken) {
          setChallenge(result.challengeToken)
          return
        }
      } else {
        await register(email, password)
      }
      navigate('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  async function onSubmitCode(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await verifyTotp(challenge!, code)
      navigate('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (challenge) {
    return (
      <div className="relative flex min-h-dvh items-center justify-center px-6">
        <Background />
        <Card className="w-full max-w-sm animate-scale-in">
          <Badge>Forex Desk</Badge>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight">Two-factor code</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Enter the 6-digit code from your authenticator app.
          </p>
          <form onSubmit={onSubmitCode} className="mt-6 space-y-4">
            <Field label="Authentication code">
              {(p) => (
                <Input
                  {...p}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]*"
                  maxLength={6}
                  required
                  autoFocus
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="123456"
                  className="text-center font-mono text-lg tracking-[0.3em]"
                />
              )}
            </Field>
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            <Button type="submit" size="lg" loading={loading} className="w-full">
              Verify
            </Button>
            <button
              type="button"
              onClick={() => {
                setChallenge(null)
                setCode('')
                setError(null)
              }}
              className="w-full text-center text-xs text-muted-foreground hover:text-primary"
            >
              Back to password
            </button>
          </form>
        </Card>
      </div>
    )
  }

  return (
    <div className="relative flex min-h-dvh items-center justify-center px-6">
      <Background />
      <Card className="w-full max-w-sm animate-scale-in">
        <Badge>Forex Desk</Badge>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight">
          {isLogin ? 'Welcome back' : 'Create your desk'}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {isLogin ? 'Sign in to your trading desk.' : 'Start tracking the markets in seconds.'}
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
          <Field label="Password">
            {(p) => (
              <Input
                {...p}
                type="password"
                autoComplete={isLogin ? 'current-password' : 'new-password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
            {isLogin ? 'Sign in' : 'Create account'}
          </Button>

          {isLogin ? (
            <p className="text-center text-xs">
              <Link to="/forgot-password" className="text-muted-foreground hover:text-primary">
                Forgot password?
              </Link>
            </p>
          ) : (
            <p className="text-center text-[11px] leading-relaxed text-muted-foreground">
              By creating an account you agree to the{' '}
              <Link to="/terms" className="text-primary hover:text-accent-bright">
                Terms
              </Link>{' '}
              and{' '}
              <Link to="/disclaimer" className="text-primary hover:text-accent-bright">
                Risk disclaimer
              </Link>
              .
            </p>
          )}
        </form>

        <p className="mt-5 text-center text-sm text-muted-foreground">
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
          <Link
            to={isLogin ? '/register' : '/login'}
            className="text-primary hover:text-accent-bright"
          >
            {isLogin ? 'Sign up' : 'Sign in'}
          </Link>
        </p>
      </Card>
    </div>
  )
}
