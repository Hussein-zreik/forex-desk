import { useEffect } from 'react'

/**
 * Set the document title + description/OG meta for a route (no dependency).
 * The prerender script writes the same values into the static HTML so crawlers
 * see them before JS; this hook keeps them correct during SPA navigation.
 */
export function useMeta(title: string, description: string) {
  useEffect(() => {
    const prevTitle = document.title
    document.title = title

    const ensure = (attr: 'name' | 'property', key: string, value: string) => {
      let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
      if (!el) {
        el = document.createElement('meta')
        el.setAttribute(attr, key)
        document.head.appendChild(el)
      }
      const prev = el.getAttribute('content')
      el.setAttribute('content', value)
      return () => {
        if (prev === null) el?.remove()
        else el?.setAttribute('content', prev)
      }
    }

    const undos = [
      ensure('name', 'description', description),
      ensure('property', 'og:title', title),
      ensure('property', 'og:description', description),
    ]
    return () => {
      document.title = prevTitle
      undos.forEach((u) => u())
    }
  }, [title, description])
}
