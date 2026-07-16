import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuth } from '@/store/useAuth'
import { VerifyEmailBanner } from './VerifyEmailBanner'

vi.mock('@/lib/api', () => ({
  api: vi.fn(),
}))
import { api } from '@/lib/api'

const mockedApi = vi.mocked(api)

function setUser(user: Partial<{ id: string; email: string; theme: string; email_verified: boolean }> | null) {
  useAuth.setState({
    user: user ? { id: '1', email: 'u@test.dev', theme: 'dark', ...user } : null,
  })
}

describe('VerifyEmailBanner', () => {
  beforeEach(() => {
    mockedApi.mockReset()
    setUser(null)
  })

  it('renders nothing for verified users', () => {
    setUser({ email_verified: true })
    const { container } = render(<VerifyEmailBanner />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders nothing when no user is loaded', () => {
    const { container } = render(<VerifyEmailBanner />)
    expect(container).toBeEmptyDOMElement()
  })

  it('prompts unverified users to resend when email is configured', async () => {
    setUser({ email_verified: false })
    mockedApi.mockResolvedValueOnce({ email_configured: true })
    render(<VerifyEmailBanner />)
    expect(await screen.findByText(/verify your email address/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /resend link/i })).toBeInTheDocument()
  })

  it('explains when the server cannot send email', async () => {
    setUser({ email_verified: false })
    mockedApi.mockResolvedValueOnce({ email_configured: false })
    render(<VerifyEmailBanner />)
    expect(
      await screen.findByText(/email delivery isn.t configured on this server/i),
    ).toBeInTheDocument()
  })

  it('confirms after resending and can be dismissed', async () => {
    setUser({ email_verified: false })
    mockedApi.mockResolvedValueOnce({ email_configured: true }) // config
    mockedApi.mockResolvedValueOnce({ ok: true }) // resend
    render(<VerifyEmailBanner />)
    await userEvent.click(await screen.findByRole('button', { name: /resend link/i }))
    expect(await screen.findByText(/verification email sent/i)).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /dismiss/i }))
    await waitFor(() =>
      expect(screen.queryByText(/verification email sent/i)).not.toBeInTheDocument(),
    )
  })
})
