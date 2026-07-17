import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useMeta } from './useMeta'

function Probe({ title, desc }: { title: string; desc: string }) {
  useMeta(title, desc)
  return null
}

const meta = (attr: string, key: string) =>
  document.head.querySelector(`meta[${attr}="${key}"]`)?.getAttribute('content')

describe('useMeta', () => {
  it('sets title, description and og tags, and restores on unmount', () => {
    document.title = 'Before'
    const { unmount } = render(<Probe title="Page Title" desc="Page description." />)

    expect(document.title).toBe('Page Title')
    expect(meta('name', 'description')).toBe('Page description.')
    expect(meta('property', 'og:title')).toBe('Page Title')
    expect(meta('property', 'og:description')).toBe('Page description.')

    unmount()
    expect(document.title).toBe('Before')
    expect(meta('property', 'og:title')).toBeUndefined()
  })

  it('updates when props change', () => {
    const { rerender } = render(<Probe title="A" desc="da" />)
    rerender(<Probe title="B" desc="db" />)
    expect(document.title).toBe('B')
    expect(meta('property', 'og:description')).toBe('db')
  })
})
