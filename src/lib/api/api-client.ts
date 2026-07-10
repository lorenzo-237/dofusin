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
  register(input: RegisterInput): Promise<AuthSession>
  login(input: LoginInput): Promise<AuthSession>

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

  searchHelpers(filters: SearchFilters): Promise<HelperSearchResult[]>
}
