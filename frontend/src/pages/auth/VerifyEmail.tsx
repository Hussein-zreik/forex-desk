import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Background } from '@/components/Background'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { api } from '@/lib/api'
import { useAuth } from '@/store/useAuth'

type State = 'verifying' | 'done' | 'failed'

export default function VerifyEmail() {
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''
  const [state, setState] = useState<State>(token ? 'verifying' : 'failed')
  const ran = useRef(false)

  useEffect(() => {
    if (!token || ran.current) return
    ran.current = true // StrictMode double-mount guard: the token is single-use
    api('/api/auth/verify-email', { method: 'POST', body: JSON.stringify({ token }) })
      .then(() => {
        setState('done')
        // Refresh the cached user so the "verify your email" banner disappears.
        if (useAuth.getState().token) void useAuth.getState().loadMe()
      })
      .catch(() => setState('failed'))
  }, [token])

  return (
    <div className="relative flex min-h-dvh items-center justify-center px-6">
      <Background />
      <Card className="w-full max-w-sm animate-scale-in text-center">
        <Badge>Forex Desk</Badge>
        {state === 'verifying' && (
          <div className="mt-6 flex flex-col items-center gap-3">
            <Spinner />
            <p className="text-sm text-muted-foreground">Verifying your email…</p>
          </div>
        )}
        {state === 'done' && (
          <>
            <h1 className="mt-4 text-2xl font-semibold tracking-tight">Email verified ✔</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              You&rsquo;re all set.{' '}
              <Link to="/dashboard" className="text-primary hover:text-accent-bright">
                Open your dashboard
              </Link>
            </p>
          </>
        )}
        {state === 'failed' && (
          <>
            <h1 className="mt-4 text-2xl font-semibold tracking-tight">Link invalid or expired</h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Sign in and use &ldquo;Resend verification&rdquo; to get a fresh link.
            </p>
            <p className="mt-4 text-sm">
              <Link to="/login" className="text-primary hover:text-accent-bright">
                Sign in
              </Link>
            </p>
          </>
        )}
      </Card>
    </div>
  )
}
