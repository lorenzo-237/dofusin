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
  // 1-200 (Dofus level range).
  level: number
  // Opt-in notification floor, independent of `level` — null means "notify
  // for any matching HelpRequest". Only affects whether a request
  // notifies/shows up for this character, never accept eligibility (still
  // level >= HelpRequest.targetMinLevel).
  notifyMinLevel: number | null
}

export type CharacterInput = Pick<
  Character,
  "name" | "server" | "class" | "level" | "notifyMinLevel"
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
  // 1-200, same range as Character.level.
  level: number
  // Mirrors Character.notifyMinLevel — see that field's comment.
  notifyMinLevel: number | null
}

export type JobInput = Pick<
  Job,
  "server" | "characterId" | "job" | "level" | "notifyMinLevel"
>

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
  minLevel: string
}

// "Recherche intelligente" broadcast: a requester asks for a character
// (optionally filtered by class) or a specific job on a server; every
// currently-available matching character/job gets notified live over
// WebSocket (see src/lib/ws-client.ts) — this shape is what both the
// REST catch-up routes and the WS `help-request:*` events carry.
export type HelpRequestStatus =
  | "OPEN"
  | "ACCEPTED"
  | "VALIDATED"
  | "DISPUTED"
  // An OPEN request nobody accepted within the expiry window — lazily
  // swept server-side (see dofusin-api/src/routes/help-requests.ts), not a
  // status the frontend ever sets itself.
  | "EXPIRED"

export interface HelpRequest {
  id: string
  requesterId: string
  server: string
  targetType: "character" | "job"
  targetClass: string | null
  targetJob: string | null
  // Applies regardless of targetType — null = no minimum.
  targetMinLevel: number | null
  // Which of the requester's own characters to whisper/be whispered by —
  // required regardless of targetType, since neither side otherwise has any
  // way to know who to contact in-game.
  requesterCharacterId: string
  requesterCharacterName: string
  requesterCharacterClass: string
  requesterCharacterLevel: number
  status: HelpRequestStatus
  helperId: string | null
  helperCharacterId: string | null
  helperJobId: string | null
  // Contact card for whoever accepted — null until then. helperCharacter*
  // is set for character-type accepts; helperJobName/Level (plus
  // helperCharacterName, resolved from the job's own representative
  // character) for job-type accepts — helperCharacterClass/Level stay null
  // in that case since a Job has no class of its own.
  helperCharacterName: string | null
  helperCharacterClass: string | null
  helperCharacterLevel: number | null
  helperJobName: string | null
  helperJobLevel: number | null
  acceptedAt: string | null
  disputeReason: string | null
  resolvedAt: string | null
  createdAt: string
}

// GET /help-requests/mine and /accepted are paginated by cursor (the last
// item's id from the previous page), not by numeric offset — an offset
// shifts every time a new request is created between two calls, a cursor
// doesn't. nextCursor is null once there's no further page.
export interface HelpRequestPage {
  items: HelpRequest[]
  nextCursor: string | null
}

export type HelpRequestInput =
  | {
      targetType: "character"
      server: string
      targetClass?: string | null
      targetMinLevel?: number | null
      requesterCharacterId: string
    }
  | {
      targetType: "job"
      server: string
      targetJob: string
      targetMinLevel?: number | null
      requesterCharacterId: string
    }

// Which of the accepting/declining side's characters or jobs is doing the
// helping — must match the request's own targetType.
export type HelpRequestResponder =
  | { targetType: "character"; characterId: string }
  | { targetType: "job"; jobId: string }

// One row per account, for the "Classement" screen — xp is the same running
// counter incremented server-side on help-request accept/validate (see
// dofusin-api's help-requests.ts and admin.ts's recalculateXp).
export interface LeaderboardEntry {
  id: string
  username: string
  avatarUrl: string | null
  xp: number
}

// "Profil" screen — same account fields as LeaderboardEntry plus what only
// makes sense for the current user's own view: strikes (see dispute-dialog,
// incremented on a DISPUTED help request, never on the leaderboard row of
// other accounts), createdAt, and rank (1-based position in the leaderboard,
// computed server-side — ties share a rank).
export interface Profile {
  id: string
  username: string
  avatarUrl: string | null
  xp: number
  strikes: number
  createdAt: string
  rank: number
}

