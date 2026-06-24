import '@testing-library/jest-dom/vitest'

// jsdom doesn't implement these observers; stub them so components that rely on
// them (framer-motion `whileInView`, react-grid-layout width measurement, etc.)
// render without crashing under test.
class NoopObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return []
  }
}

if (!('IntersectionObserver' in globalThis)) {
  globalThis.IntersectionObserver = NoopObserver as unknown as typeof IntersectionObserver
}
if (!('ResizeObserver' in globalThis)) {
  globalThis.ResizeObserver = NoopObserver as unknown as typeof ResizeObserver
}
