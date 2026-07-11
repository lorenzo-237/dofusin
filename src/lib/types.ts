export interface User {
  id: string
  username: string
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
// user has on a given server shares the same job levels, so a Job is *not*
// attached to a specific Character.
export interface Job {
  id: string
  userId: string
  server: string
  job: string
  level: string
}

export type JobInput = Pick<Job, "server" | "job" | "level">

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

export interface RegisterInput {
  username: string
  password: string
  character: CharacterInput
}

export interface LoginInput {
  username: string
  password: string
}
