import { API_BASE_URL } from '@/lib/api'

type Listener = (data: unknown) => void

const WS_URL = `${API_BASE_URL.replace(/^http/, 'ws')}/ws/prices`

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
