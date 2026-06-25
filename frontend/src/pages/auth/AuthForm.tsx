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
  const register = useAuth((s) => s.register)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const isLogin = mode === 'login'

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      if (isLogin) await login(email, password)
      else await register(email, password)
      navigate('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
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
