import type { ApiClient } from "@/lib/api/api-client"
import { ApiError } from "@/lib/api/api-client"
import { MOCK_HELPERS_POOL, MOCK_JOB_HELPERS_POOL } from "@/lib/api/mock-data"
import { todayISODate, yesterdayISODate } from "@/lib/date"
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
  LeaderboardEntry,
  Profile,
  SearchFilters,
  User,
} from "@/lib/types"

const STORAGE_KEY = "dofus-dispo:mock-db"
const SIMULATED_LATENCY_MS = 350
// Mirrors dofusin-api's DEFAULT_PAGE_SIZE (src/routes/help-requests.ts).
const HELP_REQUEST_PAGE_SIZE = 20
// Placeholder "member since" for the Profil screen — this mock DB never
// actually records when the single mock account was first created.
const MOCK_ACCOUNT_CREATED_AT = "2024-01-01T00:00:00.000Z"

type MockUser = User

interface MockDb {
  users: MockUser[]
  characters: Character[]
  jobs: Job[]
  availabilities: Availability[]
  jobAvailabilities: JobAvailability[]
  helpRequests: HelpRequest[]
  tokens: Record<string, string>
}

// Auth is Discord OAuth2 only — nothing to actually validate outside Tauri,
// so there's a single deterministic mock account (no real Discord code ever
// reaches this client, see AuthProvider.loginWithDiscord). Since there's
// only ever one mock account, HelpRequest flows that need a *second*
// account (getIncomingHelpRequests, accepting) can't be meaningfully
// exercised here — same limitation as not being able to test the real
// Discord OAuth round-trip in mock mode.
function emptyDb(): MockDb {
  return {
    users: [{ id: "u1", username: "test" }],
    characters: [],
    jobs: [],
    availabilities: [],
    jobAvailabilities: [],
    helpRequests: [],
    tokens: {},
  }
}

function loadDb(): MockDb {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return emptyDb()
  try {
    return { ...emptyDb(), ...JSON.parse(raw) } as MockDb
  } catch {
    return emptyDb()
  }
}

function saveDb(db: MockDb) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db))
}

function delay(ms = SIMULATED_LATENCY_MS) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function generateId(): string {
  return crypto.randomUUID()
}

function toSession(user: MockUser, token: string): AuthSession {
  return { user: { id: user.id, username: user.username }, token }
}

// Mirrors dofusin-api's cursor pagination (id of the last item from the
// previous page) over an already sorted-desc array.
function paginate(
  sorted: HelpRequest[],
  cursor: string | undefined,
  limit: number
): HelpRequestPage {
  const startIndex = cursor
    ? sorted.findIndex((r) => r.id === cursor) + 1
    : 0
  const page = sorted.slice(startIndex, startIndex + limit)
  const nextCursor =
    startIndex + limit < sorted.length ? page[page.length - 1]?.id ?? null : null
  return { items: page, nextCursor }
}

/**
 * Fully client-side implementation of ApiClient: no server involved, state
 * lives in localStorage so a session survives a reload. Used while the real
 * Express API isn't wired up yet (default strategy, see `../api/index.ts`).
 */
export class MockApiClient implements ApiClient {
  private resolveUserId(db: MockDb, token: string): string {
    const userId = db.tokens[token]
    if (!userId) {
      throw new ApiError("Session invalide, merci de te reconnecter.", 401)
    }
    return userId
  }

  private assertOwnedCharacter(
    db: MockDb,
    userId: string,
    characterId: string
  ): Character {
    const character = db.characters.find(
      (c) => c.id === characterId && c.userId === userId
    )
    if (!character) {
      throw new ApiError("Personnage introuvable.", 404)
    }
    return character
  }

  private assertOwnedJob(db: MockDb, userId: string, jobId: string): Job {
    const job = db.jobs.find((j) => j.id === jobId && j.userId === userId)
    if (!job) {
      throw new ApiError("Métier introuvable.", 404)
    }
    return job
  }

  async loginWithDiscord(): Promise<AuthSession> {
    await delay()
    const db = loadDb()
    const user = db.users[0]

    const token = generateId()
    db.tokens[token] = user.id
    saveDb(db)

    return toSession(user, token)
  }

  async getCharacters(token: string): Promise<Character[]> {
    await delay()
    const db = loadDb()
    const userId = this.resolveUserId(db, token)
    return db.characters.filter((c) => c.userId === userId)
  }

  async createCharacter(
    token: string,
    input: CharacterInput
  ): Promise<Character> {
    await delay()
    const db = loadDb()
    const userId = this.resolveUserId(db, token)
    const character: Character = { id: generateId(), userId, ...input }
    db.characters.push(character)
    saveDb(db)
    return character
  }

  async updateCharacter(
    token: string,
    id: string,
    input: CharacterInput
  ): Promise<Character> {
    await delay()
    const db = loadDb()
    const userId = this.resolveUserId(db, token)
    const character = this.assertOwnedCharacter(db, userId, id)
    Object.assign(character, input)
    saveDb(db)
    return character
  }

  async deleteCharacter(token: string, id: string): Promise<void> {
    await delay()
    const db = loadDb()
    const userId = this.resolveUserId(db, token)
    this.assertOwnedCharacter(db, userId, id)
    db.characters = db.characters.filter((c) => c.id !== id)
    db.availabilities = db.availabilities.filter((a) => a.characterId !== id)
    saveDb(db)
  }

  async getJobs(token: string): Promise<Job[]> {
    await delay()
    const db = loadDb()
    const userId = this.resolveUserId(db, token)
    return db.jobs.filter((j) => j.userId === userId)
  }

  async setJob(token: string, input: JobInput): Promise<Job> {
    await delay()
    const db = loadDb()
    const userId = this.resolveUserId(db, token)

    const character = this.assertOwnedCharacter(db, userId, input.characterId)
    if (character.server !== input.server) {
      throw new ApiError(
        "Ce personnage n'est pas sur le serveur sélectionné.",
        400
      )
    }

    const existing = db.jobs.find(
      (j) =>
        j.userId === userId &&
        j.server === input.server &&
        j.job === input.job
    )
    const job: Job = existing
      ? { ...existing, ...input }
      : { id: generateId(), userId, ...input }

    db.jobs = [...db.jobs.filter((j) => j.id !== job.id), job]
    saveDb(db)
    return job
  }

  async deleteJob(token: string, id: string): Promise<void> {
    await delay()
    const db = loadDb()
    const userId = this.resolveUserId(db, token)
    db.jobs = db.jobs.filter((j) => !(j.id === id && j.userId === userId))
    db.jobAvailabilities = db.jobAvailabilities.filter((a) => a.jobId !== id)
    saveDb(db)
  }

  async getMyJobAvailabilities(token: string): Promise<JobAvailability[]> {
    await delay()
    const db = loadDb()
    const userId = this.resolveUserId(db, token)
    const myJobIds = new Set(
      db.jobs.filter((j) => j.userId === userId).map((j) => j.id)
    )
    const today = todayISODate()
    return db.jobAvailabilities.filter(
      (a) => myJobIds.has(a.jobId) && a.availableDate === today
    )
  }

  async setJobAvailability(
    token: string,
    input: JobAvailabilityInput
  ): Promise<JobAvailability> {
    await delay()
    const db = loadDb()
    const userId = this.resolveUserId(db, token)
    this.assertOwnedJob(db, userId, input.jobId)

    const availability: JobAvailability = {
      ...input,
      availableDate: todayISODate(),
    }
    db.jobAvailabilities = db.jobAvailabilities.filter(
      (a) => a.jobId !== input.jobId
    )
    db.jobAvailabilities.push(availability)
    saveDb(db)
    return availability
  }

  async removeJobAvailability(token: string, jobId: string): Promise<void> {
    await delay()
    const db = loadDb()
    const userId = this.resolveUserId(db, token)
    this.assertOwnedJob(db, userId, jobId)
    db.jobAvailabilities = db.jobAvailabilities.filter(
      (a) => a.jobId !== jobId
    )
    saveDb(db)
  }

  async getStaleJobAvailabilities(token: string): Promise<JobAvailability[]> {
    await delay()
    const db = loadDb()
    const userId = this.resolveUserId(db, token)
    const myJobIds = new Set(
      db.jobs.filter((j) => j.userId === userId).map((j) => j.id)
    )
    const today = todayISODate()
    return db.jobAvailabilities.filter(
      (a) => myJobIds.has(a.jobId) && a.availableDate !== today
    )
  }

  async reactivateJobAvailabilities(
    token: string
  ): Promise<JobAvailability[]> {
    await delay()
    const db = loadDb()
    const userId = this.resolveUserId(db, token)
    const myJobIds = new Set(
      db.jobs.filter((j) => j.userId === userId).map((j) => j.id)
    )
    const today = todayISODate()
    db.jobAvailabilities = db.jobAvailabilities.map((a) =>
      myJobIds.has(a.jobId) ? { ...a, availableDate: today } : a
    )
    saveDb(db)
    return db.jobAvailabilities.filter(
      (a) => myJobIds.has(a.jobId) && a.availableDate === today
    )
  }

  async deactivateJobAvailabilities(token: string): Promise<void> {
    await delay()
    const db = loadDb()
    const userId = this.resolveUserId(db, token)
    const myJobIds = new Set(
      db.jobs.filter((j) => j.userId === userId).map((j) => j.id)
    )
    const today = todayISODate()
    const yesterday = yesterdayISODate()
    db.jobAvailabilities = db.jobAvailabilities.map((a) =>
      myJobIds.has(a.jobId) && a.availableDate === today
        ? { ...a, availableDate: yesterday }
        : a
    )
    saveDb(db)
  }

  async getMyAvailabilities(token: string): Promise<Availability[]> {
    await delay()
    const db = loadDb()
    const userId = this.resolveUserId(db, token)
    const myCharacterIds = new Set(
      db.characters.filter((c) => c.userId === userId).map((c) => c.id)
    )
    const today = todayISODate()
    return db.availabilities.filter(
      (a) => myCharacterIds.has(a.characterId) && a.availableDate === today
    )
  }

  async setAvailability(
    token: string,
    input: AvailabilityInput
  ): Promise<Availability> {
    await delay()
    const db = loadDb()
    const userId = this.resolveUserId(db, token)
    this.assertOwnedCharacter(db, userId, input.characterId)

    const availability: Availability = {
      ...input,
      availableDate: todayISODate(),
    }
    db.availabilities = db.availabilities.filter(
      (a) => a.characterId !== input.characterId
    )
    db.availabilities.push(availability)
    saveDb(db)
    return availability
  }

  async removeAvailability(token: string, characterId: string): Promise<void> {
    await delay()
    const db = loadDb()
    const userId = this.resolveUserId(db, token)
    this.assertOwnedCharacter(db, userId, characterId)
    db.availabilities = db.availabilities.filter(
      (a) => a.characterId !== characterId
    )
    saveDb(db)
  }

  async getStaleAvailabilities(token: string): Promise<Availability[]> {
    await delay()
    const db = loadDb()
    const userId = this.resolveUserId(db, token)
    const myCharacterIds = new Set(
      db.characters.filter((c) => c.userId === userId).map((c) => c.id)
    )
    const today = todayISODate()
    return db.availabilities.filter(
      (a) => myCharacterIds.has(a.characterId) && a.availableDate !== today
    )
  }

  async reactivateAvailabilities(token: string): Promise<Availability[]> {
    await delay()
    const db = loadDb()
    const userId = this.resolveUserId(db, token)
    const myCharacterIds = new Set(
      db.characters.filter((c) => c.userId === userId).map((c) => c.id)
    )
    const today = todayISODate()
    db.availabilities = db.availabilities.map((a) =>
      myCharacterIds.has(a.characterId) ? { ...a, availableDate: today } : a
    )
    saveDb(db)
    return db.availabilities.filter(
      (a) => myCharacterIds.has(a.characterId) && a.availableDate === today
    )
  }

  async deactivateAvailabilities(token: string): Promise<void> {
    await delay()
    const db = loadDb()
    const userId = this.resolveUserId(db, token)
    const myCharacterIds = new Set(
      db.characters.filter((c) => c.userId === userId).map((c) => c.id)
    )
    const today = todayISODate()
    const yesterday = yesterdayISODate()
    db.availabilities = db.availabilities.map((a) =>
      myCharacterIds.has(a.characterId) && a.availableDate === today
        ? { ...a, availableDate: yesterday }
        : a
    )
    saveDb(db)
  }

  async searchHelpers(filters: SearchFilters): Promise<HelperSearchResult[]> {
    await delay()
    const db = loadDb()
    const today = todayISODate()

    const liveHelpers: HelperSearchResult[] = db.availabilities
      .filter((a) => a.availableDate === today)
      .map((a) => {
        const character = db.characters.find((c) => c.id === a.characterId)
        if (!character) return null
        const jobs = db.jobs
          .filter(
            (j) =>
              j.userId === character.userId && j.server === character.server
          )
          .map((j) => ({ job: j.job, level: j.level }))
        return {
          id: character.id,
          name: character.name,
          server: character.server,
          class: character.class,
          level: character.level,
          price: a.free ? 0 : Number(a.price) || 0,
          jobs,
        } satisfies HelperSearchResult
      })
      .filter((h): h is HelperSearchResult => h !== null)

    const pool = [...MOCK_HELPERS_POOL, ...liveHelpers]

    return pool.filter((h) => {
      if (filters.server && h.server !== filters.server) return false
      if (filters.class && h.class !== filters.class) return false
      if (filters.minLevel && h.level < Number(filters.minLevel)) return false
      return true
    })
  }

  async searchJobHelpers(
    filters: JobSearchFilters
  ): Promise<JobSearchResult[]> {
    await delay()
    const db = loadDb()
    const today = todayISODate()

    const liveJobHelpers: JobSearchResult[] = db.jobAvailabilities
      .filter((a) => a.availableDate === today)
      .map((a) => {
        const job = db.jobs.find((j) => j.id === a.jobId)
        if (!job) return null
        const character = db.characters.find((c) => c.id === job.characterId)
        if (!character) return null
        return {
          id: job.id,
          job: job.job,
          level: job.level,
          price: a.free ? 0 : Number(a.price) || 0,
          server: job.server,
          characterName: character.name,
          characterClass: character.class,
          characterLevel: character.level,
        } satisfies JobSearchResult
      })
      .filter((h): h is JobSearchResult => h !== null)

    const pool = [...MOCK_JOB_HELPERS_POOL, ...liveJobHelpers]

    return pool.filter(
      (h) =>
        h.server === filters.server &&
        h.job === filters.job &&
        (!filters.minLevel || h.level >= Number(filters.minLevel))
    )
  }

  async createHelpRequest(
    token: string,
    input: HelpRequestInput
  ): Promise<HelpRequest> {
    await delay()
    const db = loadDb()
    const requesterId = this.resolveUserId(db, token)
    const requesterCharacter = this.assertOwnedCharacter(
      db,
      requesterId,
      input.requesterCharacterId
    )

    const helpRequest: HelpRequest = {
      id: generateId(),
      requesterId,
      server: input.server,
      targetType: input.targetType,
      targetClass:
        input.targetType === "character" ? (input.targetClass ?? null) : null,
      targetJob: input.targetType === "job" ? input.targetJob : null,
      targetMinLevel: input.targetMinLevel ?? null,
      requesterCharacterId: requesterCharacter.id,
      requesterCharacterName: requesterCharacter.name,
      requesterCharacterClass: requesterCharacter.class,
      requesterCharacterLevel: requesterCharacter.level,
      status: "OPEN",
      helperId: null,
      helperCharacterId: null,
      helperJobId: null,
      helperCharacterName: null,
      helperCharacterClass: null,
      helperCharacterLevel: null,
      helperJobName: null,
      helperJobLevel: null,
      acceptedAt: null,
      disputeReason: null,
      resolvedAt: null,
      createdAt: new Date().toISOString(),
    }
    db.helpRequests.push(helpRequest)
    saveDb(db)
    return helpRequest
  }

  // Always empty in practice: with a single mock account, every request in
  // the DB was created by "me", so none can match "everyone but me". See
  // the note on emptyDb().
  async getIncomingHelpRequests(token: string): Promise<HelpRequest[]> {
    await delay()
    const db = loadDb()
    const userId = this.resolveUserId(db, token)
    return db.helpRequests.filter(
      (r) => r.status === "OPEN" && r.requesterId !== userId
    )
  }

  async getMyHelpRequests(
    token: string,
    cursor?: string
  ): Promise<HelpRequestPage> {
    await delay()
    const db = loadDb()
    const userId = this.resolveUserId(db, token)
    const sorted = db.helpRequests
      .filter((r) => r.requesterId === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    return paginate(sorted, cursor, HELP_REQUEST_PAGE_SIZE)
  }

  // Always empty in practice, same reason as acceptHelpRequest can never
  // actually succeed in mock mode: a single account can't accept its own
  // requests.
  async getAcceptedHelpRequests(
    token: string,
    cursor?: string
  ): Promise<HelpRequestPage> {
    await delay()
    const db = loadDb()
    const userId = this.resolveUserId(db, token)
    const sorted = db.helpRequests
      .filter((r) => r.helperId === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    return paginate(sorted, cursor, HELP_REQUEST_PAGE_SIZE)
  }

  async acceptHelpRequest(
    token: string,
    id: string,
    responder: HelpRequestResponder
  ): Promise<HelpRequest> {
    await delay()
    const db = loadDb()
    const userId = this.resolveUserId(db, token)

    const helpRequest = db.helpRequests.find((r) => r.id === id)
    if (!helpRequest) throw new ApiError("Demande introuvable.", 404)
    if (helpRequest.requesterId === userId) {
      throw new ApiError("Tu ne peux pas répondre à ta propre demande.", 400)
    }
    if (helpRequest.status !== "OPEN") {
      throw new ApiError(
        "Cette demande a déjà été prise par quelqu'un d'autre.",
        409
      )
    }

    if (responder.targetType === "character") {
      const character = this.assertOwnedCharacter(
        db,
        userId,
        responder.characterId
      )
      helpRequest.helperCharacterId = character.id
      helpRequest.helperCharacterName = character.name
      helpRequest.helperCharacterClass = character.class
      helpRequest.helperCharacterLevel = character.level
    } else {
      const job = this.assertOwnedJob(db, userId, responder.jobId)
      helpRequest.helperJobId = job.id
      helpRequest.helperJobName = job.job
      helpRequest.helperJobLevel = job.level
      helpRequest.helperCharacterName =
        db.characters.find((c) => c.id === job.characterId)?.name ?? null
    }

    helpRequest.status = "ACCEPTED"
    helpRequest.helperId = userId
    helpRequest.acceptedAt = new Date().toISOString()

    saveDb(db)
    return helpRequest
  }

  async declineHelpRequestAndGoUnavailable(
    token: string,
    id: string,
    responder: HelpRequestResponder
  ): Promise<void> {
    await delay()
    const db = loadDb()
    const userId = this.resolveUserId(db, token)

    const helpRequest = db.helpRequests.find((r) => r.id === id)
    if (!helpRequest) throw new ApiError("Demande introuvable.", 404)

    if (responder.targetType === "character") {
      const character = this.assertOwnedCharacter(
        db,
        userId,
        responder.characterId
      )
      db.availabilities = db.availabilities.filter(
        (a) => a.characterId !== character.id
      )
    } else {
      const job = this.assertOwnedJob(db, userId, responder.jobId)
      db.jobAvailabilities = db.jobAvailabilities.filter(
        (a) => a.jobId !== job.id
      )
    }
    saveDb(db)
  }

  async validateHelpRequest(token: string, id: string): Promise<HelpRequest> {
    await delay()
    const db = loadDb()
    const userId = this.resolveUserId(db, token)

    const helpRequest = db.helpRequests.find((r) => r.id === id)
    if (!helpRequest) throw new ApiError("Demande introuvable.", 404)
    if (helpRequest.requesterId !== userId) {
      throw new ApiError("Seul l'auteur de la demande peut la valider.", 403)
    }
    if (helpRequest.status !== "ACCEPTED") {
      throw new ApiError(
        "Cette demande n'est pas en attente de validation.",
        400
      )
    }

    helpRequest.status = "VALIDATED"
    helpRequest.resolvedAt = new Date().toISOString()
    saveDb(db)
    return helpRequest
  }

  async disputeHelpRequest(
    token: string,
    id: string,
    reason: string
  ): Promise<HelpRequest> {
    await delay()
    const db = loadDb()
    const userId = this.resolveUserId(db, token)

    const helpRequest = db.helpRequests.find((r) => r.id === id)
    if (!helpRequest) throw new ApiError("Demande introuvable.", 404)
    if (helpRequest.requesterId !== userId) {
      throw new ApiError(
        "Seul l'auteur de la demande peut ouvrir un litige.",
        403
      )
    }
    if (helpRequest.status !== "ACCEPTED") {
      throw new ApiError(
        "Cette demande n'est pas en attente de validation.",
        400
      )
    }

    helpRequest.status = "DISPUTED"
    helpRequest.disputeReason = reason
    helpRequest.resolvedAt = new Date().toISOString()
    saveDb(db)
    return helpRequest
  }

  // Same single-mock-account limitation as getIncomingHelpRequests/
  // getAcceptedHelpRequests above: with only one account, and no local xp
  // counter in this mock DB, this always comes back as one entry at 0 xp.
  async getLeaderboard(token: string): Promise<LeaderboardEntry[]> {
    await delay()
    const db = loadDb()
    const userId = this.resolveUserId(db, token)
    const user = db.users.find((u) => u.id === userId)
    if (!user) throw new ApiError("Utilisateur introuvable.", 404)
    return [
      { id: user.id, username: user.username, avatarUrl: user.avatarUrl ?? null, xp: 0 },
    ]
  }

  // Same 0-xp, single-account limitation as getLeaderboard — always rank #1
  // since it's the only account, with a fixed placeholder join date.
  async getProfile(token: string): Promise<Profile> {
    await delay()
    const db = loadDb()
    const userId = this.resolveUserId(db, token)
    const user = db.users.find((u) => u.id === userId)
    if (!user) throw new ApiError("Utilisateur introuvable.", 404)
    return {
      id: user.id,
      username: user.username,
      avatarUrl: user.avatarUrl ?? null,
      xp: 0,
      strikes: 0,
      createdAt: MOCK_ACCOUNT_CREATED_AT,
      rank: 1,
    }
  }
}
