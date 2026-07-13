/* eslint-disable react-refresh/only-export-components */
import * as React from "react"
import { invoke, isTauri } from "@tauri-apps/api/core"
import { listen } from "@tauri-apps/api/event"
import { openUrl } from "@tauri-apps/plugin-opener"
import { toast } from "sonner"

import { getApiClient } from "@/lib/api"
import { getSession, setSession, subscribeSession } from "@/lib/auth-store"
import type {
  Availability,
  AvailabilityInput,
  Character,
  CharacterInput,
  HelpRequest,
  HelpRequestInput,
  HelpRequestResponder,
  Job,
  JobAvailability,
  JobAvailabilityInput,
  JobInput,
  User,
} from "@/lib/types"
import { showNotificationPopup } from "@/lib/notification-window"
import { connectWs, disconnectWs, onWsEvent } from "@/lib/ws-client"

function describeHelpRequestTarget(request: HelpRequest): string {
  const label =
    request.targetType === "job"
      ? request.targetJob
      : (request.targetClass ?? "Toutes classes")
  return `${label} · ${request.server}`
}

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

  // Characters/jobs that were available on some previous day but aren't
  // today — the settings (free/price) are still there, just not republished
  // yet. Lets the Accueil screen offer "reactivate everything as it was".
  staleAvailabilities: Availability[]
  staleJobAvailabilities: JobAvailability[]
  reactivateAll: () => Promise<void>

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

  // "Recherche intelligente" — see HelpRequest in lib/types.ts.
  // incomingHelpRequests: OPEN requests I could accept.
  // myHelpRequests: requests I created (any status) — validate/dispute live here.
  // acceptedHelpRequests: requests I accepted as a helper (any status).
  // Kept live by the WS listener below; REST-fetched once on login as a
  // catch-up for whatever happened while the app was closed.
  incomingHelpRequests: HelpRequest[]
  myHelpRequests: HelpRequest[]
  acceptedHelpRequests: HelpRequest[]
  createHelpRequest: (input: HelpRequestInput) => Promise<void>
  dismissIncomingHelpRequest: (id: string) => void
  acceptHelpRequest: (
    id: string,
    responder: HelpRequestResponder
  ) => Promise<void>
  declineHelpRequestAndGoUnavailable: (
    id: string,
    responder: HelpRequestResponder
  ) => Promise<void>
  validateHelpRequest: (id: string) => Promise<void>
  disputeHelpRequest: (id: string, reason: string) => Promise<void>
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
  const [staleAvailabilities, setStaleAvailabilities] = React.useState<
    Availability[]
  >([])
  const [staleJobAvailabilities, setStaleJobAvailabilities] = React.useState<
    JobAvailability[]
  >([])
  const [incomingHelpRequests, setIncomingHelpRequests] = React.useState<
    HelpRequest[]
  >([])
  const [myHelpRequests, setMyHelpRequests] = React.useState<HelpRequest[]>([])
  const [acceptedHelpRequests, setAcceptedHelpRequests] = React.useState<
    HelpRequest[]
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
      client.getStaleAvailabilities(token),
      client.getStaleJobAvailabilities(token),
      client.getIncomingHelpRequests(token),
      client.getMyHelpRequests(token),
      client.getAcceptedHelpRequests(token),
    ]).then(
      ([
        nextCharacters,
        nextJobs,
        nextAvailabilities,
        nextJobAvailabilities,
        nextStaleAvailabilities,
        nextStaleJobAvailabilities,
        nextIncomingHelpRequests,
        nextMyHelpRequests,
        nextAcceptedHelpRequests,
      ]) => {
        if (cancelled) return
        setCharacters(nextCharacters)
        setJobs(nextJobs)
        setAvailabilities(nextAvailabilities)
        setJobAvailabilities(nextJobAvailabilities)
        setStaleAvailabilities(nextStaleAvailabilities)
        setStaleJobAvailabilities(nextStaleJobAvailabilities)
        setIncomingHelpRequests(nextIncomingHelpRequests)
        setMyHelpRequests(nextMyHelpRequests)
        setAcceptedHelpRequests(nextAcceptedHelpRequests)
        setLoadedForToken(token)
      }
    )
    return () => {
      cancelled = true
    }
  }, [token])

  // Live delivery for "recherche intelligente" — only meaningful against a
  // real backend, there's nothing to connect to in mock strategy (see
  // ws-client.ts). REST above already fetched the current state; this only
  // keeps it live from here on.
  React.useEffect(() => {
    if (!token) return
    if (import.meta.env.VITE_API_STRATEGY !== "http") return
    connectWs(token)
    return () => disconnectWs()
  }, [token])

  React.useEffect(() => {
    return onWsEvent((event) => {
      switch (event.type) {
        case "help-request:incoming": {
          setIncomingHelpRequests((prev) =>
            prev.some((r) => r.id === event.payload.id)
              ? prev
              : [...prev, event.payload]
          )
          const target = describeHelpRequestTarget(event.payload)
          toast.info(`Nouvelle demande d'aide : ${target}`)
          void showNotificationPopup("Demande d'aide", target)
          break
        }
        case "help-request:accepted":
          setMyHelpRequests((prev) =>
            prev.map((r) => (r.id === event.payload.id ? event.payload : r))
          )
          toast.success("Quelqu'un a accepté ta demande !")
          void showNotificationPopup(
            "Demande acceptée",
            "Quelqu'un a accepté ta demande d'aide."
          )
          break
        case "help-request:closed":
          setIncomingHelpRequests((prev) =>
            prev.filter((r) => r.id !== event.payload.id)
          )
          break
        case "help-request:resolved":
          setAcceptedHelpRequests((prev) =>
            prev.map((r) => (r.id === event.payload.id ? event.payload : r))
          )
          if (event.payload.status === "VALIDATED") {
            toast.success("Aide validée, +1 xp !")
            void showNotificationPopup("Aide validée", "+1 xp pour t'avoir aidé.")
          } else if (event.payload.status === "DISPUTED") {
            toast.error("Un litige a été ouvert sur une de tes aides.")
            void showNotificationPopup(
              "Litige ouvert",
              "Un litige a été ouvert sur une de tes aides."
            )
          }
          break
      }
    })
  }, [])

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
    setStaleAvailabilities([])
    setStaleJobAvailabilities([])
    setIncomingHelpRequests([])
    setMyHelpRequests([])
    setAcceptedHelpRequests([])
  }, [])

  const requireToken = React.useCallback(() => {
    if (!token) throw new Error("Non authentifié.")
    return token
  }, [token])

  const reactivateAll = React.useCallback(async () => {
    const activeToken = requireToken()
    const [nextAvailabilities, nextJobAvailabilities] = await Promise.all([
      getApiClient().reactivateAvailabilities(activeToken),
      getApiClient().reactivateJobAvailabilities(activeToken),
    ])
    setAvailabilities(nextAvailabilities)
    setJobAvailabilities(nextJobAvailabilities)
    setStaleAvailabilities([])
    setStaleJobAvailabilities([])
  }, [requireToken])

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
      setStaleAvailabilities((prev) =>
        prev.filter((a) => a.characterId !== id)
      )
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
      setStaleJobAvailabilities((prev) => prev.filter((a) => a.jobId !== id))
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
      // No longer stale — it's active today now.
      setStaleAvailabilities((prev) =>
        prev.filter((a) => a.characterId !== input.characterId)
      )
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
      // No longer stale — it's active today now.
      setStaleJobAvailabilities((prev) =>
        prev.filter((a) => a.jobId !== input.jobId)
      )
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

  const createHelpRequest = React.useCallback(
    async (input: HelpRequestInput) => {
      const activeToken = requireToken()
      const helpRequest = await getApiClient().createHelpRequest(
        activeToken,
        input
      )
      setMyHelpRequests((prev) => [helpRequest, ...prev])
    },
    [requireToken]
  )

  // Declining without going unavailable never touches the server — the
  // request stays OPEN for other matching helpers either way, so there's
  // nothing to persist, just a local dismissal.
  const dismissIncomingHelpRequest = React.useCallback((id: string) => {
    setIncomingHelpRequests((prev) => prev.filter((r) => r.id !== id))
  }, [])

  const acceptHelpRequest = React.useCallback(
    async (id: string, responder: HelpRequestResponder) => {
      const activeToken = requireToken()
      const helpRequest = await getApiClient().acceptHelpRequest(
        activeToken,
        id,
        responder
      )
      setIncomingHelpRequests((prev) => prev.filter((r) => r.id !== id))
      setAcceptedHelpRequests((prev) => [helpRequest, ...prev])
    },
    [requireToken]
  )

  const declineHelpRequestAndGoUnavailable = React.useCallback(
    async (id: string, responder: HelpRequestResponder) => {
      const activeToken = requireToken()
      await getApiClient().declineHelpRequestAndGoUnavailable(
        activeToken,
        id,
        responder
      )
      setIncomingHelpRequests((prev) => prev.filter((r) => r.id !== id))
      // Mirrors removeAvailability/removeJobAvailability — the whole row is
      // gone, not just today's entry.
      if (responder.targetType === "character") {
        setAvailabilities((prev) =>
          prev.filter((a) => a.characterId !== responder.characterId)
        )
        setStaleAvailabilities((prev) =>
          prev.filter((a) => a.characterId !== responder.characterId)
        )
      } else {
        setJobAvailabilities((prev) =>
          prev.filter((a) => a.jobId !== responder.jobId)
        )
        setStaleJobAvailabilities((prev) =>
          prev.filter((a) => a.jobId !== responder.jobId)
        )
      }
    },
    [requireToken]
  )

  const validateHelpRequest = React.useCallback(
    async (id: string) => {
      const activeToken = requireToken()
      const helpRequest = await getApiClient().validateHelpRequest(
        activeToken,
        id
      )
      setMyHelpRequests((prev) =>
        prev.map((r) => (r.id === id ? helpRequest : r))
      )
    },
    [requireToken]
  )

  const disputeHelpRequest = React.useCallback(
    async (id: string, reason: string) => {
      const activeToken = requireToken()
      const helpRequest = await getApiClient().disputeHelpRequest(
        activeToken,
        id,
        reason
      )
      setMyHelpRequests((prev) =>
        prev.map((r) => (r.id === id ? helpRequest : r))
      )
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
      staleAvailabilities,
      staleJobAvailabilities,
      reactivateAll,
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
      incomingHelpRequests,
      myHelpRequests,
      acceptedHelpRequests,
      createHelpRequest,
      dismissIncomingHelpRequest,
      acceptHelpRequest,
      declineHelpRequestAndGoUnavailable,
      validateHelpRequest,
      disputeHelpRequest,
    }),
    [
      session,
      token,
      characters,
      charactersLoaded,
      jobs,
      availabilities,
      jobAvailabilities,
      staleAvailabilities,
      staleJobAvailabilities,
      reactivateAll,
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
      incomingHelpRequests,
      myHelpRequests,
      acceptedHelpRequests,
      createHelpRequest,
      dismissIncomingHelpRequest,
      acceptHelpRequest,
      declineHelpRequestAndGoUnavailable,
      validateHelpRequest,
      disputeHelpRequest,
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
