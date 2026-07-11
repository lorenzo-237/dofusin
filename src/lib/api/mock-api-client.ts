import type { ApiClient } from "@/lib/api/api-client"
import { ApiError } from "@/lib/api/api-client"
import { MOCK_HELPERS_POOL } from "@/lib/api/mock-data"
import { todayISODate } from "@/lib/date"
import type {
  Availability,
  AvailabilityInput,
  AuthSession,
  Character,
  CharacterInput,
  HelperSearchResult,
  Job,
  JobInput,
  LoginInput,
  RegisterInput,
  SearchFilters,
  User,
} from "@/lib/types"

const STORAGE_KEY = "dofus-dispo:mock-db"
const SIMULATED_LATENCY_MS = 350

interface MockUser extends User {
  password: string
}

interface MockDb {
  users: MockUser[]
  characters: Character[]
  jobs: Job[]
  availabilities: Availability[]
  tokens: Record<string, string>
}

function emptyDb(): MockDb {
  return {
    users: [{ id: "u1", username: "test", password: "test" }],
    characters: [],
    jobs: [],
    availabilities: [],
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

  async register(input: RegisterInput): Promise<AuthSession> {
    await delay()
    const db = loadDb()
    const username = input.username.trim()
    const usernameTaken = db.users.some(
      (u) => u.username.toLowerCase() === username.toLowerCase()
    )
    if (usernameTaken) {
      throw new ApiError("Ce pseudo est déjà utilisé.", 409)
    }

    const user: MockUser = {
      id: generateId(),
      username,
      password: input.password,
    }
    const character: Character = {
      id: generateId(),
      userId: user.id,
      name: input.character.name.trim(),
      server: input.character.server,
      class: input.character.class,
      level: input.character.level,
    }
    const token = generateId()

    db.users.push(user)
    db.characters.push(character)
    db.tokens[token] = user.id
    saveDb(db)

    return toSession(user, token)
  }

  async login(input: LoginInput): Promise<AuthSession> {
    await delay()
    const db = loadDb()
    const username = input.username.trim()
    const user = db.users.find(
      (u) => u.username.toLowerCase() === username.toLowerCase()
    )
    if (!user || user.password !== input.password) {
      throw new ApiError("Pseudo ou mot de passe incorrect.", 401)
    }

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

    const existing = db.jobs.find(
      (j) =>
        j.userId === userId &&
        j.server === input.server &&
        j.job === input.job
    )
    const job: Job = existing
      ? { ...existing, level: input.level }
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
}
