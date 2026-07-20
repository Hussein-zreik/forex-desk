import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/api', () => ({
  api: vi.fn(),
  setAuthToken: vi.fn(),
}))
import { api, setAuthToken } from '@/lib/api'
import { useAuth } from './useAuth'

const mockedApi = vi.mocked(api)
const mockedSetToken = vi.mocked(setAuthToken)

describe('useAuth login', () => {
  beforeEach(() => {
    mockedApi.mockReset()
    mockedSetToken.mockReset()
    useAuth.setState({ token: null, user: null })
  })

  it('signs straight in when the server returns a bearer token', async () => {
    mockedApi
      .mockResolvedValueOnce({ access_token: 'tok-1' }) // login
      .mockResolvedValueOnce({ id: '1', email: 'a@b.c', theme: 'dark' }) // me

    const result = await useAuth.getState().login('a@b.c', 'pw')

    expect(result).toEqual({ totpRequired: false })
    expect(mockedSetToken).toHaveBeenCalledWith('tok-1')
    expect(useAuth.getState().token).toBe('tok-1')
    expect(useAuth.getState().user?.email).toBe('a@b.c')
  })

  it('returns the 2FA challenge without signing in', async () => {
    mockedApi.mockResolvedValueOnce({ totp_required: true, challenge_token: 'chal-1' })

    const result = await useAuth.getState().login('a@b.c', 'pw')

    expect(result).toEqual({ totpRequired: true, challengeToken: 'chal-1' })
    expect(mockedSetToken).not.toHaveBeenCalled()
    expect(useAuth.getState().token).toBeNull()
  })

  it('logoutEverywhere swaps in the fresh token and stays signed in', async () => {
    useAuth.setState({ token: 'old-tok', user: { id: '1', email: 'a@b.c', theme: 'dark' } })
    mockedApi.mockResolvedValueOnce({ access_token: 'new-tok' })

    await useAuth.getState().logoutEverywhere()

    expect(mockedApi).toHaveBeenCalledWith('/api/auth/logout-all', { method: 'POST' })
    expect(mockedSetToken).toHaveBeenCalledWith('new-tok')
    expect(useAuth.getState().token).toBe('new-tok')
    expect(useAuth.getState().user).not.toBeNull() // still signed in
  })

  it('verifyTotp exchanges challenge + code for a session', async () => {
    mockedApi
      .mockResolvedValueOnce({ access_token: 'tok-2' }) // totp/verify
      .mockResolvedValueOnce({ id: '1', email: 'a@b.c', theme: 'dark', totp_enabled: true }) // me

    await useAuth.getState().verifyTotp('chal-1', '123456')

    expect(mockedApi).toHaveBeenCalledWith('/api/auth/totp/verify', {
      method: 'POST',
      body: JSON.stringify({ challenge_token: 'chal-1', code: '123456' }),
    })
    expect(useAuth.getState().token).toBe('tok-2')
    expect(useAuth.getState().user?.totp_enabled).toBe(true)
  })
})
