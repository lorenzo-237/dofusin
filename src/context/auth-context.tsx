/* eslint-disable react-refresh/only-export-components */
import * as React from "react"
import { invoke, isTauri } from "@tauri-apps/api/core"
import { listen } from "@tauri-apps/api/event"
import { openUrl } from "@tauri-apps/plugin-opener"

import { getApiClient } from "@/lib/api"
import { getSession, setSession, subscribeSession } from "@/lib/auth-store"
import type {
  Availability,
  AvailabilityInput,
  Character,
  CharacterInput,
  Job,
  JobAvailability,
  JobAvailabilityInput,
  JobInput,
  User,
} from "@/lib/types"

// Discord OAuth2 rejects custom URI schemes as redirect_uri — this loopback
// server (started Rust-side, see src-tauri/src/oauth.rs) is the RFC 8252
// pattern for native apps instead. Fixed port because Discord requires an
// exact, pre-registered redirect_uri.
const DISCORD_REDIRECT_URI = "http://localhost:48991/callback"

export class CancelledLoginError extends Error {
  constructor() {
    super("Connexion annulée.")
    this.name = "CancelledLoginError"
  }
}

interface AuthContextValue {
  user: User | null
  token: string | null
  isAuthenticated: boolean

  characters: Character[]
  charactersLoaded: boolean
  jobs: Job[]
  availabilities: Availability[]
  jobAvailabilities: JobAvailability[]

  loginWithDiscord: () => Promise<void>
  cancelDiscordLogin: () => void
  logout: () => void

  createCharacter: (input: CharacterInput) => Promise<void>
  updateCharacter: (id: string, input: CharacterInput) => Promise<void>
  deleteCharacter: (id: string) => Promise<void>

  setJob: (input: JobInput) => Promise<void>
  deleteJob: (id: string) => Promise<void>

  setAvailability: (input: AvailabilityInput) => Promise<void>
  removeAvailability: (characterId: string) => Promise<void>

  setJobAvailability: (input: JobAvailabilityInput) => Promise<void>
  removeJobAvailability: (jobId: string) => Promise<void>
}

const AuthContext = React.createContext<AuthContextValue | undefined>(
  undefined
)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const session = React.useSyncExternalStore(subscribeSession, getSession)
  const [characters, setCharacters] = React.useState<Character[]>([])
  const [jobs, setJobs] = React.useState<Job[]>([])
  const [availabilities, setAvailabilities] = React.useState<Availability[]>(
    []
  )
  const [jobAvailabilities, setJobAvailabilities] = React.useState<
    JobAvailability[]
  >([])

  const token = session?.token ?? null
  // Derived (not synced via effect setState) so it naturally reads false
  // whenever the token is absent or a fetch for the *current* token hasn't
  // resolved yet — including right after a fresh login, before the effect
  // below has had a chance to run.
  const [loadedForToken, setLoadedForToken] = React.useState<string | null>(
    null
  )
  const charactersLoaded = token != null && loadedForToken === token

  React.useEffect(() => {
    if (!token) return
    let cancelled = false
    const client = getApiClient()
    void Promise.all([
      client.getCharacters(token),
      client.getJobs(token),
      client.getMyAvailabilities(token),
      client.getMyJobAvailabilities(token),
    ]).then(
      ([
        nextCharacters,
        nextJobs,
        nextAvailabilities,
        nextJobAvailabilities,
      ]) => {
        if (cancelled) return
        setCharacters(nextCharacters)
        setJobs(nextJobs)
        setAvailabilities(nextAvailabilities)
        setJobAvailabilities(nextJobAvailabilities)
        setLoadedForToken(token)
      }
    )
    return () => {
      cancelled = true
    }
  }, [token])

  // Resolved/rejected by the oauth://callback listener below once Discord
  // redirects back to the local loopback server — kept in a ref so the
  // listener (registered once, at the provider level) can settle whatever
  // promise loginWithDiscord() is currently awaiting.
  const pendingLoginRef = React.useRef<{
    state: string
    resolve: (code: string) => void
    reject: (reason: unknown) => void
  } | null>(null)

  React.useEffect(() => {
    if (!isTauri()) return
    const unlistenPromise = listen<string>("oauth://callback", (event) => {
      const pending = pendingLoginRef.current
      if (!pending) return

      const params = new URLSearchParams(event.payload)
      const code = params.get("code")
      const state = params.get("state")
      if (!code || state !== pending.state) return

      pendingLoginRef.current = null
      pending.resolve(code)
    })
    return () => {
      void unlistenPromise.then((unlisten) => unlisten())
    }
  }, [])

  const loginWithDiscord = React.useCallback(async () => {
    const isRealDiscordFlow =
      isTauri() && import.meta.env.VITE_API_STRATEGY === "http"

    if (!isRealDiscordFlow) {
      // No loopback server outside Tauri, and nothing to actually exchange
      // in mock strategy — skip the browser round-trip entirely.
      const nextSession = await getApiClient().loginWithDiscord("mock")
      setSession(nextSession)
      return
    }

    // Starts once per app run (no-op on later calls) — see oauth.rs.
    await invoke("start_oauth_callback_server")

    const code = await new Promise<string>((resolve, reject) => {
      const state = crypto.randomUUID()
      pendingLoginRef.current = { state, resolve, reject }
      const params = new URLSearchParams({
        client_id: import.meta.env.VITE_DISCORD_CLIENT_ID ?? "",
        redirect_uri: DISCORD_REDIRECT_URI,
        response_type: "code",
        scope: "identify",
        state,
      })
      openUrl(
        `https://discord.com/api/v10/oauth2/authorize?${params.toString()}`
      ).catch(reject)
    })

    const nextSession = await getApiClient().loginWithDiscord(code)
    setSession(nextSession)
  }, [])

  const cancelDiscordLogin = React.useCallback(() => {
    pendingLoginRef.current?.reject(new CancelledLoginError())
    pendingLoginRef.current = null
  }, [])

  const logout = React.useCallback(() => {
    setSession(null)
    setCharacters([])
    setJobs([])
    setAvailabilities([])
    setJobAvailabilities([])
  }, [])

  const requireToken = React.useCallback(() => {
    if (!token) throw new Error("Non authentifié.")
    return token
  }, [token])

  const createCharacter = React.useCallback(
    async (input: CharacterInput) => {
      const activeToken = requireToken()
      const character = await getApiClient().createCharacter(
        activeToken,
        input
      )
      setCharacters((prev) => [...prev, character])
    },
    [requireToken]
  )

  const updateCharacter = React.useCallback(
    async (id: string, input: CharacterInput) => {
      const activeToken = requireToken()
      const updated = await getApiClient().updateCharacter(
        activeToken,
        id,
        input
      )
      setCharacters((prev) => prev.map((c) => (c.id === id ? updated : c)))
    },
    [requireToken]
  )

  const deleteCharacter = React.useCallback(
    async (id: string) => {
      const activeToken = requireToken()
      await getApiClient().deleteCharacter(activeToken, id)
      setCharacters((prev) => prev.filter((c) => c.id !== id))
      setAvailabilities((prev) => prev.filter((a) => a.characterId !== id))
    },
    [requireToken]
  )

  const setJob = React.useCallback(
    async (input: JobInput) => {
      const activeToken = requireToken()
      const job = await getApiClient().setJob(activeToken, input)
      setJobs((prev) => [...prev.filter((j) => j.id !== job.id), job])
    },
    [requireToken]
  )

  const deleteJob = React.useCallback(
    async (id: string) => {
      const activeToken = requireToken()
      await getApiClient().deleteJob(activeToken, id)
      setJobs((prev) => prev.filter((j) => j.id !== id))
      setJobAvailabilities((prev) => prev.filter((a) => a.jobId !== id))
    },
    [requireToken]
  )

  const setAvailability = React.useCallback(
    async (input: AvailabilityInput) => {
      const activeToken = requireToken()
      const availability = await getApiClient().setAvailability(
        activeToken,
        input
      )
      setAvailabilities((prev) => [
        ...prev.filter((a) => a.characterId !== input.characterId),
        availability,
      ])
    },
    [requireToken]
  )

  const removeAvailability = React.useCallback(
    async (characterId: string) => {
      const activeToken = requireToken()
      await getApiClient().removeAvailability(activeToken, characterId)
      setAvailabilities((prev) =>
        prev.filter((a) => a.characterId !== characterId)
      )
    },
    [requireToken]
  )

  const setJobAvailability = React.useCallback(
    async (input: JobAvailabilityInput) => {
      const activeToken = requireToken()
      const availability = await getApiClient().setJobAvailability(
        activeToken,
        input
      )
      setJobAvailabilities((prev) => [
        ...prev.filter((a) => a.jobId !== input.jobId),
        availability,
      ])
    },
    [requireToken]
  )

  const removeJobAvailability = React.useCallback(
    async (jobId: string) => {
      const activeToken = requireToken()
      await getApiClient().removeJobAvailability(activeToken, jobId)
      setJobAvailabilities((prev) => prev.filter((a) => a.jobId !== jobId))
    },
    [requireToken]
  )

  const value = React.useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      token,
      isAuthenticated: session != null,
      characters,
      charactersLoaded,
      jobs,
      availabilities,
      jobAvailabilities,
      loginWithDiscord,
      cancelDiscordLogin,
      logout,
      createCharacter,
      updateCharacter,
      deleteCharacter,
      setJob,
      deleteJob,
      setAvailability,
      removeAvailability,
      setJobAvailability,
      removeJobAvailability,
    }),
    [
      session,
      token,
      characters,
      charactersLoaded,
      jobs,
      availabilities,
      jobAvailabilities,
      loginWithDiscord,
      cancelDiscordLogin,
      logout,
      createCharacter,
      updateCharacter,
      deleteCharacter,
      setJob,
      deleteJob,
      setAvailability,
      removeAvailability,
      setJobAvailability,
      removeJobAvailability,
    ]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = React.useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
