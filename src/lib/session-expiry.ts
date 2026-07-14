type Listener = () => void

const listeners = new Set<Listener>()

/**
 * Plain module-level pub/sub (same pattern as auth-store.ts/ws-client.ts) so
 * http-api-client.ts — a plain function, not a component — can signal an
 * expired/invalid session without depending on React or the router.
 * AuthProvider is the sole subscriber: it logs out and redirects to /login.
 */
export function notifySessionExpired(): void {
  listeners.forEach((listener) => listener())
}

export function onSessionExpired(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
