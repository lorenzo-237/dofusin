import type {
  Availability,
  AvailabilityInput,
  AuthSession,
  Character,
  CharacterInput,
  HelperSearchResult,
  HelpRequest,
  HelpRequestInput,
  HelpRequestPage,
  HelpRequestResponder,
  Job,
  JobAvailability,
  JobAvailabilityInput,
  JobInput,
  JobSearchFilters,
  JobSearchResult,
  SearchFilters,
} from "@/lib/types"

export class ApiError extends Error {
  status?: number

  constructor(message: string, status?: number) {
    super(message)
    this.name = "ApiError"
    this.status = status
  }
}

/**
 * Strategy interface for every data operation the app needs.
 * Screens and the auth context depend only on this contract, never on a
 * concrete implementation, so swapping mock <-> real API is a one-line change
 * (see `getApiClient` in `./index.ts`).
 */
export interface ApiClient {
  // Auth is Discord OAuth2 only — no password is ever stored. `code` is the
  // authorization code obtained via the local loopback server (or a
  // placeholder outside Tauri, see AuthProvider.loginWithDiscord).
  loginWithDiscord(code: string): Promise<AuthSession>

  getCharacters(token: string): Promise<Character[]>
  createCharacter(token: string, input: CharacterInput): Promise<Character>
  updateCharacter(
    token: string,
    id: string,
    input: CharacterInput
  ): Promise<Character>
  deleteCharacter(token: string, id: string): Promise<void>

  // Jobs are per-account-per-server, not per-character (see Job in
  // lib/types.ts): every character the user has on a given server shares
  // the same job levels.
  getJobs(token: string): Promise<Job[]>
  setJob(token: string, input: JobInput): Promise<Job>
  deleteJob(token: string, id: string): Promise<void>

  getMyAvailabilities(token: string): Promise<Availability[]>
  setAvailability(
    token: string,
    input: AvailabilityInput
  ): Promise<Availability>
  removeAvailability(token: string, characterId: string): Promise<void>

  // Availability is one row per character (upserted, never deleted on
  // expiry) — "stale" means the row's date isn't today, but the previous
  // free/price settings are still right there. Lets the app offer
  // "reactivate everything as it was" the next day instead of redoing it
  // character by character.
  getStaleAvailabilities(token: string): Promise<Availability[]>
  reactivateAvailabilities(token: string): Promise<Availability[]>
  // Mirror-opposite of reactivateAvailabilities — restamps every one of
  // today's rows to yesterday (keeping free/price), so they fall into
  // "stale" instead. Used by the desktop app's close-confirmation flow
  // (CloseConfirmDialog): closing doesn't clear availability on its own,
  // this is what actually does it before the window exits.
  deactivateAvailabilities(token: string): Promise<void>

  // Being "available" for a job (e.g. crafting for hire) is tracked
  // separately from character availability — a job isn't a character (see
  // Job in lib/types.ts), so it needs its own availability + price.
  getMyJobAvailabilities(token: string): Promise<JobAvailability[]>
  setJobAvailability(
    token: string,
    input: JobAvailabilityInput
  ): Promise<JobAvailability>
  removeJobAvailability(token: string, jobId: string): Promise<void>

  // Mirrors getStaleAvailabilities/reactivateAvailabilities for jobs.
  getStaleJobAvailabilities(token: string): Promise<JobAvailability[]>
  reactivateJobAvailabilities(token: string): Promise<JobAvailability[]>
  deactivateJobAvailabilities(token: string): Promise<void>

  searchHelpers(filters: SearchFilters): Promise<HelperSearchResult[]>

  // Server + job are both required (see JobSearchFilters) — unlike
  // searchHelpers there's no "browse everything" mode, you look up one
  // specific job on one specific server.
  searchJobHelpers(filters: JobSearchFilters): Promise<JobSearchResult[]>

  // "Recherche intelligente" — see HelpRequest in lib/types.ts. Live
  // delivery happens over WebSocket (src/lib/ws-client.ts); these REST
  // methods are both the mutation path (create/accept/decline/validate/
  // dispute) and the catch-up path for whatever a WS push might have
  // missed while offline.
  createHelpRequest(token: string, input: HelpRequestInput): Promise<HelpRequest>
  getIncomingHelpRequests(token: string): Promise<HelpRequest[]>
  // Cursor-paginated (see HelpRequestPage) — cursor omitted fetches the
  // first page.
  getMyHelpRequests(token: string, cursor?: string): Promise<HelpRequestPage>
  // Symmetric to getMyHelpRequests but from the helper's side — catch-up
  // for help-request:resolved if I was offline when it got validated/disputed.
  getAcceptedHelpRequests(
    token: string,
    cursor?: string
  ): Promise<HelpRequestPage>
  acceptHelpRequest(
    token: string,
    id: string,
    responder: HelpRequestResponder
  ): Promise<HelpRequest>
  declineHelpRequestAndGoUnavailable(
    token: string,
    id: string,
    responder: HelpRequestResponder
  ): Promise<void>
  validateHelpRequest(token: string, id: string): Promise<HelpRequest>
  disputeHelpRequest(
    token: string,
    id: string,
    reason: string
  ): Promise<HelpRequest>
}
