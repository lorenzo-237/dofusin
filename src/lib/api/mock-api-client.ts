import type { ApiClient } from "@/lib/api/api-client"
import { ApiError } from "@/lib/api/api-client"
import { MOCK_HELPERS_POOL, MOCK_JOB_HELPERS_POOL } from "@/lib/api/mock-data"
import { todayISODate } from "@/lib/date"
import type {
  Availability,
  AvailabilityInput,
  AuthSession,
  Character,
  CharacterInput,
  HelperSearchResult,
  Job,
  JobAvailability,
  JobAvailabilityInput,
  JobInput,
  JobSearchFilters,
  JobSearchResult,
  SearchFilters,
  User,
} from "@/lib/types"

const STORAGE_KEY = "dofus-dispo:mock-db"
const SIMULATED_LATENCY_MS = 350

type MockUser = User

interface MockDb {
  users: MockUser[]
  characters: Character[]
  jobs: Job[]
  availabilities: Availability[]
  jobAvailabilities: JobAvailability[]
  tokens: Record<string, string>
}

// Auth is Discord OAuth2 only — nothing to actually validate outside Tauri,
// so there's a single deterministic mock account (no real Discord code ever
// reaches this client, see AuthProvider.loginWithDiscord).
function emptyDb(): MockDb {
  return {
    users: [{ id: "u1", username: "test" }],
    characters: [],
    jobs: [],
    availabilities: [],
    jobAvailabilities: [],
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
          .map((j) => ({ job: j.job, level: Number(j.level) || 0 }))
        return {
          id: character.id,
          name: character.name,
          server: character.server,
          class: character.class,
          level: Number(character.level) || 0,
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
          level: Number(job.level) || 0,
          price: a.free ? 0 : Number(a.price) || 0,
          server: job.server,
          characterName: character.name,
          characterClass: character.class,
          characterLevel: Number(character.level) || 0,
        } satisfies JobSearchResult
      })
      .filter((h): h is JobSearchResult => h !== null)

    const pool = [...MOCK_JOB_HELPERS_POOL, ...liveJobHelpers]

    return pool.filter(
      (h) => h.server === filters.server && h.job === filters.job
    )
  }
}
