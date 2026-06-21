import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from './App'

test('renders the Welcome page at root', () => {
  render(
    <MemoryRouter initialEntries={['/']}>
      <App />
    </MemoryRouter>,
  )
  expect(screen.getByRole('heading', { name: /forex desk/i })).toBeInTheDocument()
})

test('redirects unauthenticated users away from protected routes', () => {
  render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <App />
    </MemoryRouter>,
  )
  // ProtectedRoute -> /login -> the auth form heading
  expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument()
})
