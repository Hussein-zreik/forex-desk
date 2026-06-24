import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from './App'

// Routes are lazy-loaded, so the page heading resolves asynchronously
// (the Suspense fallback renders first). Use findByRole to await it.
test('renders the Welcome page at root', async () => {
  render(
    <MemoryRouter initialEntries={['/']}>
      <App />
    </MemoryRouter>,
  )
  expect(await screen.findByRole('heading', { name: /gold & forex/i })).toBeInTheDocument()
})

test('redirects unauthenticated users away from protected routes', async () => {
  render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <App />
    </MemoryRouter>,
  )
  // ProtectedRoute -> /login -> the auth form heading
  expect(await screen.findByRole('heading', { name: /welcome back/i })).toBeInTheDocument()
})
