import { API_BASE_URL } from '@/lib/api'

type Listener = (data: unknown) => void

/**
 * WebSocket endpoint. With an absolute API base (separate frontend/backend) we
 * derive it from that; with an empty base (single-origin deploy where the API
 * serves the app) we build it from the page's own host so http→ws / https→wss.
 */
function priceSocketUrl(): string {
  if (API_BASE_URL) return `${API_BASE_URL.replace(/^http/, 'ws')}/ws/prices`
  if (typeof window !== 'undefined') {
    const proto = window.location.protocol === 'https:' ? 'wss' : 'ws'
    return `${proto}://${window.location.host}/ws/prices`
  }
  return '/ws/prices'
}

const WS_URL = priceSocketUrl()

/** Resilient WebSocket client with exponential-backoff reconnect. */
export class PriceSocket {
  private ws: WebSocket | null = null
  private listeners = new Set<Listener>()
  private retry = 0
  private closed = false
  private readonly url: string

  constructor(url: string = WS_URL) {
    this.url = url
  }

  connect() {
    if (typeof WebSocket === 'undefined') return // e.g. test environment
    this.closed = false
    try {
      this.ws = new WebSocket(this.url)
    } catch {
      this.scheduleReconnect()
      return
    }
    this.ws.onopen = () => {
      this.retry = 0
    }
    this.ws.onmessage = (event) => {
      try {
        this.emit(JSON.parse(event.data))
      } catch {
        // ignore malformed frames
      }
    }
    this.ws.onclose = () => {
      if (!this.closed) this.scheduleReconnect()
    }
  }

  private scheduleReconnect() {
    const delay = Math.min(1000 * 2 ** this.retry, 15000)
    this.retry += 1
    setTimeout(() => {
      if (!this.closed) this.connect()
    }, delay)
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private emit(data: unknown) {
    for (const listener of this.listeners) listener(data)
  }

  close() {
    this.closed = true
    this.ws?.close()
    this.ws = null
  }
}
