/* eslint-disable react-refresh/only-export-components */
import * as React from "react"
import { invoke, isTauri } from "@tauri-apps/api/core"
import { listen } from "@tauri-apps/api/event"
import { openUrl } from "@tauri-apps/plugin-opener"
import { useNavigate } from "@tanstack/react-router"
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
import { onSessionExpired } from "@/lib/session-expiry"
import { connectWs, disconnectWs, onWsEvent } from "@/lib/ws-client"

function describeHelpRequestTarget(request: HelpRequest): string {
  const label =
    request.targetType === "job"
      ? request.targetJob
      : (request.targetClass ?? "Toutes classes")
  return `${label} · ${request.server}`
}

// Kept as a plain string union here (not imported from the route file) so
// this context doesn't depend on a specific route module — routes already
// depend on this context (useAuth), not the other way around.
type HelpRequestsTab = "create" | "incoming" | "mine"

function isHelpRequestsTab(value: string): value is HelpRequestsTab {
  return value === "create" || value === "incoming" || value === "mine"
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
  // Mirror-opposite of reactivateAll — used by CloseConfirmDialog before
  // the desktop window actually exits (closing doesn't clear availability
  // on its own, see dofusin-api's POST .../deactivate).
  deactivateAll: () => Promise<void>

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
  // Cursor pagination (see HelpRequestPage) — myHelpRequests/
  // acceptedHelpRequests above only ever hold what's been loaded so far
  // (first page on login, more appended by these two loaders on demand).
  myHelpRequestsHasMore: boolean
  acceptedHelpRequestsHasMore: boolean
  isLoadingMoreMyHelpRequests: boolean
  isLoadingMoreAcceptedHelpRequests: boolean
  loadMoreMyHelpRequests: () => Promise<void>
  loadMoreAcceptedHelpRequests: () => Promise<void>
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

  // The request just accepted via acceptHelpRequest, so the Entraide screen
  // can auto-open the whisper-message dialog with the requester's contact
  // info — kept at this (route-independent) level rather than in the
  // incoming-request card itself, since that card unmounts the instant the
  // accepted request leaves incomingHelpRequests (same render pass as the
  // accept), before any local "just accepted" state could ever paint.
  lastAcceptedHelpRequest: HelpRequest | null
  clearLastAcceptedHelpRequest: () => void
}

const AuthContext = React.createContext<AuthContextValue | undefined>(
  undefined
)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()
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
  const [myHelpRequestsCursor, setMyHelpRequestsCursor] = React.useState<
    string | null
  >(null)
  const [acceptedHelpRequestsCursor, setAcceptedHelpRequestsCursor] =
    React.useState<string | null>(null)
  const [isLoadingMoreMyHelpRequests, setIsLoadingMoreMyHelpRequests] =
    React.useState(false)
  const [
    isLoadingMoreAcceptedHelpRequests,
    setIsLoadingMoreAcceptedHelpRequests,
  ] = React.useState(false)
  const [lastAcceptedHelpRequest, setLastAcceptedHelpRequest] =
    React.useState<HelpRequest | null>(null)

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
        nextMyHelpRequestsPage,
        nextAcceptedHelpRequestsPage,
      ]) => {
        if (cancelled) return
        setCharacters(nextCharacters)
        setJobs(nextJobs)
        setAvailabilities(nextAvailabilities)
        setJobAvailabilities(nextJobAvailabilities)
        setStaleAvailabilities(nextStaleAvailabilities)
        setStaleJobAvailabilities(nextStaleJobAvailabilities)
        setIncomingHelpRequests(nextIncomingHelpRequests)
        setMyHelpRequests(nextMyHelpRequestsPage.items)
        setMyHelpRequestsCursor(nextMyHelpRequestsPage.nextCursor)
        setAcceptedHelpRequests(nextAcceptedHelpRequestsPage.items)
        setAcceptedHelpRequestsCursor(nextAcceptedHelpRequestsPage.nextCursor)
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

  const goToHelpRequests = React.useCallback(
    (tab: HelpRequestsTab) => {
      void navigate({ to: "/help-requests", search: { tab } })
    },
    [navigate]
  )

  // Read via ref inside the WS listener effects below instead of listing
  // goToHelpRequests as a dependency — those effects must register their
  // listener exactly once (like the oauth://callback one further down),
  // not re-subscribe every time this identity changes. Re-subscribing on
  // every AuthProvider render was the actual bug behind toasts firing more
  // than once per event (see ws-client.ts for the matching fix on the
  // socket side).
  const goToHelpRequestsRef = React.useRef(goToHelpRequests)
  React.useEffect(() => {
    goToHelpRequestsRef.current = goToHelpRequests
  }, [goToHelpRequests])

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
          toast.info(`Nouvelle demande d'aide : ${target}`, {
            action: {
              label: "Voir",
              onClick: () => goToHelpRequestsRef.current("incoming"),
            },
          })
          void showNotificationPopup("Demande d'aide", target, "incoming")
          break
        }
        case "help-request:accepted":
          setMyHelpRequests((prev) =>
            prev.map((r) => (r.id === event.payload.id ? event.payload : r))
          )
          toast.success("Quelqu'un a accepté ta demande !", {
            action: {
              label: "Voir",
              onClick: () => goToHelpRequestsRef.current("mine"),
            },
          })
          void showNotificationPopup(
            "Demande acceptée",
            "Quelqu'un a accepté ta demande d'aide.",
            "mine"
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
            toast.success("Aide validée, +1 xp !", {
              action: {
                label: "Voir",
                onClick: () => goToHelpRequestsRef.current("mine"),
              },
            })
            void showNotificationPopup(
              "Aide validée",
              "+1 xp pour t'avoir aidé.",
              "mine"
            )
          } else if (event.payload.status === "DISPUTED") {
            toast.error("Un litige a été ouvert sur une de tes aides.", {
              action: {
                label: "Voir",
                onClick: () => goToHelpRequestsRef.current("mine"),
              },
            })
            void showNotificationPopup(
              "Litige ouvert",
              "Un litige a été ouvert sur une de tes aides.",
              "mine"
            )
          }
          break
      }
    })
  }, [])

  // The popup window (public/notification.html) is a separate JS
  // context/window — this is how a click over there reaches the router
  // over here, same IPC pattern as the oauth://callback listener below.
  React.useEffect(() => {
    const unlistenPromise = listen<{ tab: string }>(
      "notification-click",
      (event) => {
        if (isHelpRequestsTab(event.payload.tab)) {
          goToHelpRequestsRef.current(event.payload.tab)
        }
      }
    )
    return () => {
      void unlistenPromise.then((unlisten) => unlisten())
    }
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
    setMyHelpRequestsCursor(null)
    setAcceptedHelpRequestsCursor(null)
    setLastAcceptedHelpRequest(null)
  }, [])

  // Kept in a ref (updated on identity change, read inside a listener
  // registered exactly once) so the subscription below doesn't need
  // `logout`/`navigate` as effect deps — same pattern as goToHelpRequestsRef
  // further up, for the same reason (register once, not on every render).
  const handleSessionExpiredRef = React.useRef(() => {})
  React.useEffect(() => {
    handleSessionExpiredRef.current = () => {
      logout()
      toast.error("Session expirée, merci de te reconnecter.")
      void navigate({ to: "/login" })
    }
  }, [logout, navigate])

  // Fired by http-api-client.ts when an authenticated request comes back
  // 401 (expired/invalid JWT, 30d TTL — see dofusin-api/src/lib/jwt.ts).
  // Without this the app stays visually "logged in" while every request
  // silently fails until the user manually logs out.
  React.useEffect(() => {
    return onSessionExpired(() => handleSessionExpiredRef.current())
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

  // Mirror-opposite of reactivateAll. Moves today's rows into the stale
  // lists locally (matching what the server just did to them) rather than
  // re-fetching — good enough since the only caller (CloseConfirmDialog)
  // runs this right before the window exits.
  const deactivateAll = React.useCallback(async () => {
    const activeToken = requireToken()
    await Promise.all([
      getApiClient().deactivateAvailabilities(activeToken),
      getApiClient().deactivateJobAvailabilities(activeToken),
    ])
    setStaleAvailabilities((prev) => [...prev, ...availabilities])
    setStaleJobAvailabilities((prev) => [...prev, ...jobAvailabilities])
    setAvailabilities([])
    setJobAvailabilities([])
  }, [requireToken, availabilities, jobAvailabilities])

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

  const loadMoreMyHelpRequests = React.useCallback(async () => {
    const activeToken = requireToken()
    if (!myHelpRequestsCursor || isLoadingMoreMyHelpRequests) return
    setIsLoadingMoreMyHelpRequests(true)
    try {
      const page = await getApiClient().getMyHelpRequests(
        activeToken,
        myHelpRequestsCursor
      )
      setMyHelpRequests((prev) => [...prev, ...page.items])
      setMyHelpRequestsCursor(page.nextCursor)
    } finally {
      setIsLoadingMoreMyHelpRequests(false)
    }
  }, [requireToken, myHelpRequestsCursor, isLoadingMoreMyHelpRequests])

  const loadMoreAcceptedHelpRequests = React.useCallback(async () => {
    const activeToken = requireToken()
    if (!acceptedHelpRequestsCursor || isLoadingMoreAcceptedHelpRequests) return
    setIsLoadingMoreAcceptedHelpRequests(true)
    try {
      const page = await getApiClient().getAcceptedHelpRequests(
        activeToken,
        acceptedHelpRequestsCursor
      )
      setAcceptedHelpRequests((prev) => [...prev, ...page.items])
      setAcceptedHelpRequestsCursor(page.nextCursor)
    } finally {
      setIsLoadingMoreAcceptedHelpRequests(false)
    }
  }, [
    requireToken,
    acceptedHelpRequestsCursor,
    isLoadingMoreAcceptedHelpRequests,
  ])

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
      setLastAcceptedHelpRequest(helpRequest)
    },
    [requireToken]
  )

  const clearLastAcceptedHelpRequest = React.useCallback(() => {
    setLastAcceptedHelpRequest(null)
  }, [])

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
      deactivateAll,
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
      myHelpRequestsHasMore: myHelpRequestsCursor !== null,
      acceptedHelpRequestsHasMore: acceptedHelpRequestsCursor !== null,
      isLoadingMoreMyHelpRequests,
      isLoadingMoreAcceptedHelpRequests,
      loadMoreMyHelpRequests,
      loadMoreAcceptedHelpRequests,
      createHelpRequest,
      dismissIncomingHelpRequest,
      acceptHelpRequest,
      declineHelpRequestAndGoUnavailable,
      validateHelpRequest,
      disputeHelpRequest,
      lastAcceptedHelpRequest,
      clearLastAcceptedHelpRequest,
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
      deactivateAll,
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
      myHelpRequestsCursor,
      acceptedHelpRequestsCursor,
      isLoadingMoreMyHelpRequests,
      isLoadingMoreAcceptedHelpRequests,
      loadMoreMyHelpRequests,
      loadMoreAcceptedHelpRequests,
      createHelpRequest,
      dismissIncomingHelpRequest,
      acceptHelpRequest,
      declineHelpRequestAndGoUnavailable,
      validateHelpRequest,
      disputeHelpRequest,
      lastAcceptedHelpRequest,
      clearLastAcceptedHelpRequest,
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
