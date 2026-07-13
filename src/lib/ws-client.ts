import type { HelpRequest } from "@/lib/types"

// Matches the WsMessage shape emitted by dofusin-api's src/ws/registry.ts.
// Payload shape depends on `type` — closed only ever needs the id (the
// request itself may already be gone from local state by then).
export type WsEvent =
  | { type: "help-request:incoming"; payload: HelpRequest }
  | { type: "help-request:accepted"; payload: HelpRequest }
  | { type: "help-request:closed"; payload: { id: string } }
  | { type: "help-request:resolved"; payload: HelpRequest }

const RECONNECT_DELAY_MS = 3000

function deriveWsUrl(token: string): string {
  const base = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000/api"
  const url = new URL(base)
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:"
  url.pathname = "/ws"
  url.search = ""
  url.searchParams.set("token", token)
  return url.toString()
}

type Listener = (event: WsEvent) => void

// Plain module-level singleton (same pattern as auth-store.ts) — there's
// only ever one WS connection for the whole app, no need for it to live in
// React state.
let socket: WebSocket | null = null
let reconnectTimer: number | undefined
let currentToken: string | null = null
const listeners = new Set<Listener>()

function openSocket(token: string) {
  socket = new WebSocket(deriveWsUrl(token))

  socket.onmessage = (event: MessageEvent<string>) => {
    try {
      const parsed = JSON.parse(event.data) as WsEvent
      listeners.forEach((listener) => listener(parsed))
    } catch {
      // Malformed/unexpected message — ignore rather than crash the socket.
    }
  }

  socket.onclose = () => {
    socket = null
    if (!currentToken) return
    window.clearTimeout(reconnectTimer)
    reconnectTimer = window.setTimeout(() => {
      if (currentToken) openSocket(currentToken)
    }, RECONNECT_DELAY_MS)
  }

  socket.onerror = () => {
    socket?.close()
  }
}

/**
 * Live delivery for "recherche intelligente" (see
 * dofusin-api/docs/help-requests.md) — only meaningful against the real
 * backend (VITE_API_STRATEGY=http), there's nothing to connect to in mock
 * strategy. Reconnects on drop with a fixed delay; call disconnectWs() to
 * stop that (logout) rather than just letting the socket close on its own.
 */
export function connectWs(token: string): void {
  currentToken = token
  socket?.close()
  openSocket(token)
}

export function disconnectWs(): void {
  currentToken = null
  window.clearTimeout(reconnectTimer)
  socket?.close()
  socket = null
}

export function onWsEvent(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
