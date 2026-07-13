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

// Strips the handlers before closing so a socket that's mid-close (the
// WebSocket close handshake is async, it doesn't finish the instant
// .close() is called) can never deliver another message — without this, a
// StrictMode dev double-mount (connect → disconnect → connect again, back
// to back) could briefly leave two sockets both "open" from the server's
// point of view, and a single server push would reach both, firing every
// listener twice for what should've been one event.
function closeSocket(target: WebSocket | null) {
  if (!target) return
  target.onmessage = null
  target.onclose = null
  target.onerror = null
  target.close()
}

function openSocket(token: string) {
  const nextSocket = new WebSocket(deriveWsUrl(token))
  socket = nextSocket

  nextSocket.onmessage = (event: MessageEvent<string>) => {
    // Extra guard alongside closeSocket() above: ignore anything from a
    // socket that's no longer the current one.
    if (socket !== nextSocket) return
    try {
      const parsed = JSON.parse(event.data) as WsEvent
      listeners.forEach((listener) => listener(parsed))
    } catch {
      // Malformed/unexpected message — ignore rather than crash the socket.
    }
  }

  nextSocket.onclose = () => {
    if (socket === nextSocket) socket = null
    if (!currentToken) return
    window.clearTimeout(reconnectTimer)
    reconnectTimer = window.setTimeout(() => {
      if (currentToken) openSocket(currentToken)
    }, RECONNECT_DELAY_MS)
  }

  nextSocket.onerror = () => {
    nextSocket.close()
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
  closeSocket(socket)
  openSocket(token)
}

export function disconnectWs(): void {
  currentToken = null
  window.clearTimeout(reconnectTimer)
  closeSocket(socket)
  socket = null
}

export function onWsEvent(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
