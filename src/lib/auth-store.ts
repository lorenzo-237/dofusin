import type { AuthSession } from "@/lib/types"

const STORAGE_KEY = "dofus-dispo:session"

type Listener = () => void

const listeners = new Set<Listener>()
let session: AuthSession | null = loadSession()

function loadSession(): AuthSession | null {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as AuthSession
  } catch {
    return null
  }
}

/**
 * Plain module-level store (not a React hook) so TanStack Router's
 * `beforeLoad` — which runs outside any component — can read the current
 * session synchronously to guard routes. `AuthProvider` subscribes to it to
 * expose the same state reactively to components.
 */
export function getSession(): AuthSession | null {
  return session
}

export function setSession(next: AuthSession | null): void {
  session = next
  if (next) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } else {
    localStorage.removeItem(STORAGE_KEY)
  }
  listeners.forEach((listener) => listener())
}

export function subscribeSession(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
