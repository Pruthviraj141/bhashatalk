import type { IncomingWsEnvelope } from '../types/chat'

interface SocketHandlers {
  onOpen?: () => void
  onError?: (message: string) => void
  onMessage?: (event: IncomingWsEnvelope) => void
  onClose?: () => void
}

export class ChatSocketClient {
  private socket: WebSocket | null = null
  private reconnectTimer: number | null = null
  private active = false
  private reconnectAttempts = 0
  private userId: string | null = null
  private handlers: SocketHandlers | null = null

  connect(userId: string, handlers: SocketHandlers): void {
    this.disconnect()
    this.active = true
    this.userId = userId
    this.handlers = handlers
    this.open()
  }

  private open(): void {
    if (!this.userId || !this.handlers) return

    const url = this.resolveWebSocketUrl(this.userId)

    this.socket = new WebSocket(url)

    this.socket.onopen = () => {
      this.reconnectAttempts = 0
      this.handlers?.onOpen?.()
    }
    this.socket.onerror = () => this.handlers?.onError?.('WebSocket connection error')
    this.socket.onclose = () => {
      this.handlers?.onClose?.()
      if (!this.active) return

      const delay = Math.min(1000 * 2 ** this.reconnectAttempts, 10000)
      this.reconnectAttempts += 1
      this.reconnectTimer = window.setTimeout(() => this.open(), delay)
    }
    this.socket.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data) as IncomingWsEnvelope
        this.handlers?.onMessage?.(parsed)
      } catch {
        this.handlers?.onError?.('Invalid message payload from server')
      }
    }
  }

  private resolveWebSocketUrl(userId: string): string {
    const wsEnv = import.meta.env.VITE_WS_HOST as string | undefined
    const apiBaseEnv = import.meta.env.VITE_API_BASE_URL as string | undefined

    if (wsEnv && wsEnv.trim()) {
      const raw = wsEnv.trim()
      if (raw.startsWith('ws://') || raw.startsWith('wss://')) {
        return `${raw.replace(/\/$/, '')}/ws/${encodeURIComponent(userId)}`
      }
      const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
      return `${protocol}://${raw.replace(/\/$/, '')}/ws/${encodeURIComponent(userId)}`
    }

    if (apiBaseEnv && apiBaseEnv.trim()) {
      try {
        const parsed = new URL(apiBaseEnv)
        const wsProtocol = parsed.protocol === 'https:' ? 'wss:' : 'ws:'
        return `${wsProtocol}//${parsed.host}/ws/${encodeURIComponent(userId)}`
      } catch {
        // Fall through to default.
      }
    }

    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
    return `${protocol}://${window.location.host}/ws/${encodeURIComponent(userId)}`
  }

  sendMessage(payload: {
    chat_id: string
    client_message_id: string
    sender_id: string
    receiver_id: string
    message: string
    sender_lang: string
    receiver_lang: string
  }): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return

    this.socket.send(
      JSON.stringify({
        type: 'message',
        payload,
      }),
    )
  }

  sendTyping(payload: {
    chat_id: string
    sender_id: string
    receiver_id: string
    is_typing: boolean
  }): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return

    this.socket.send(
      JSON.stringify({
        type: 'typing',
        payload,
      }),
    )
  }

  disconnect(): void {
    this.active = false
    if (this.reconnectTimer !== null) {
      window.clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    if (!this.socket) return
    this.socket.close()
    this.socket = null
  }
}
