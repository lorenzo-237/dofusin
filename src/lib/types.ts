export interface User {
  id: string
  username: string
  avatarUrl?: string
}

export interface AuthSession {
  user: User
  token: string
}

export interface Character {
  id: string
  userId: string
  name: string
  server: string
  class: string
  level: string
}

export type CharacterInput = Pick<
  Character,
  "name" | "server" | "class" | "level"
>

// Professions are per-account-per-server in the game: every character the
// user has on a given server shares the same job levels, so the level isn't
// tied to a specific Character. `characterId` is only a display/contact
// pick — which of the account's characters on that server to show (and
// whisper) alongside this job — not an ownership relationship.
export interface Job {
  id: string
  userId: string
  server: string
  characterId: string
  job: string
  level: string
}

export type JobInput = Pick<Job, "server" | "characterId" | "job" | "level">

export interface Availability {
  characterId: string
  availableDate: string
  free: boolean
  price: number | null
}

export type AvailabilityInput = Pick<
  Availability,
  "characterId" | "free" | "price"
>

export interface JobAvailability {
  jobId: string
  availableDate: string
  free: boolean
  price: number | null
}

export type JobAvailabilityInput = Pick<
  JobAvailability,
  "jobId" | "free" | "price"
>

export interface HelperJobLevel {
  job: string
  level: number
}

export interface HelperSearchResult {
  id: string
  name: string
  server: string
  class: string
  level: number
  price: number
  jobs: HelperJobLevel[]
}

export interface SearchFilters {
  server: string
  class: string
  minLevel: string
}

// A job-for-hire listing: unlike HelperSearchResult (a character), this
// represents a Job that's actually marked available for craft today (see
// JobAvailability), with the account's chosen representative character
// (Job.characterId) shown alongside it for contact purposes.
export interface JobSearchResult {
  id: string
  job: string
  level: number
  price: number
  server: string
  characterName: string
  characterClass: string
  characterLevel: number
}

export interface JobSearchFilters {
  server: string
  job: string
}

// "Recherche intelligente" broadcast: a requester asks for a character
// (optionally filtered by class) or a specific job on a server; every
// currently-available matching character/job gets notified live over
// WebSocket (see src/lib/ws-client.ts) — this shape is what both the
// REST catch-up routes and the WS `help-request:*` events carry.
export type HelpRequestStatus = "OPEN" | "ACCEPTED" | "VALIDATED" | "DISPUTED"

export interface HelpRequest {
  id: string
  requesterId: string
  server: string
  targetType: "character" | "job"
  targetClass: string | null
  targetJob: string | null
  status: HelpRequestStatus
  helperId: string | null
  helperCharacterId: string | null
  helperJobId: string | null
  acceptedAt: string | null
  disputeReason: string | null
  resolvedAt: string | null
  createdAt: string
}

export type HelpRequestInput =
  | { targetType: "character"; server: string; targetClass?: string | null }
  | { targetType: "job"; server: string; targetJob: string }

// Which of the accepting/declining side's characters or jobs is doing the
// helping — must match the request's own targetType.
export type HelpRequestResponder =
  | { targetType: "character"; characterId: string }
  | { targetType: "job"; jobId: string }

