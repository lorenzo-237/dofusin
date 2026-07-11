import type { ApiClient } from "@/lib/api/api-client"
import { ApiError } from "@/lib/api/api-client"
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
  LoginInput,
  RegisterInput,
  SearchFilters,
  User,
} from "@/lib/types"

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000/api"

interface LoginResponse {
  token: string
}

/**
 * The cahier des charges only guarantees the login route returns a JWT, not
 * a user payload, so the account id is read from the token's own claims
 * (falls back to the username we already know if the claim is absent).
 */
function decodeUserIdFromToken(token: string, fallback: string): string {
  try {
    const payload = token.split(".")[1]
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/")
    const json = JSON.parse(atob(normalized)) as Record<string, unknown>
    const id = json.sub ?? json.id ?? json.userId
    return typeof id === "string" ? id : fallback
  } catch {
    return fallback
  }
}

async function request<T>(
  path: string,
  options: { method?: string; token?: string; body?: unknown } = {}
): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method: options.method ?? "GET",
      headers: {
        "Content-Type": "application/json",
        ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    })
  } catch {
    throw new ApiError("Impossible de contacter le serveur. Vérifie ta connexion.")
  }

  if (!response.ok) {
    const message = await response
      .json()
      .then((data: { message?: string }) => data.message)
      .catch(() => undefined)
    throw new ApiError(
      message ?? "Une erreur est survenue.",
      response.status
    )
  }

  if (response.status === 204) {
    return undefined as T
  }
  return (await response.json()) as T
}

/**
 * Real implementation of ApiClient, wired to the Express REST API described
 * in project/cahier_charges.md. Selected when VITE_API_STRATEGY=http.
 */
export class HttpApiClient implements ApiClient {
  async register(input: RegisterInput): Promise<AuthSession> {
    await request("/auth/register", {
      method: "POST",
      body: { username: input.username, password: input.password },
    })
    const session = await this.login({
      username: input.username,
      password: input.password,
    })
    await this.createCharacter(session.token, input.character)
    return session
  }

  async login(input: LoginInput): Promise<AuthSession> {
    const { token } = await request<LoginResponse>("/auth/login", {
      method: "POST",
      body: input,
    })
    const user: User = {
      id: decodeUserIdFromToken(token, input.username),
      username: input.username,
    }
    return { user, token }
  }

  getCharacters(token: string): Promise<Character[]> {
    return request<Character[]>("/characters", { token })
  }

  createCharacter(token: string, input: CharacterInput): Promise<Character> {
    return request<Character>("/characters", {
      method: "POST",
      token,
      body: input,
    })
  }

  updateCharacter(
    token: string,
    id: string,
    input: CharacterInput
  ): Promise<Character> {
    return request<Character>(`/characters/${id}`, {
      method: "PUT",
      token,
      body: input,
    })
  }

  async deleteCharacter(token: string, id: string): Promise<void> {
    await request(`/characters/${id}`, { method: "DELETE", token })
  }

  // Not in the cahier des charges: professions are per-account-per-server
  // (every character a user has on a given server shares the same job
  // levels), not per-character, so this is a standalone resource rather
  // than a field on /characters.
  getJobs(token: string): Promise<Job[]> {
    return request<Job[]>("/jobs", { token })
  }

  setJob(token: string, input: JobInput): Promise<Job> {
    return request<Job>("/jobs", { method: "POST", token, body: input })
  }

  async deleteJob(token: string, id: string): Promise<void> {
    await request(`/jobs/${id}`, { method: "DELETE", token })
  }

  // Not in the cahier des charges: the frontend needs to know which of the
  // current user's characters are already available today (e.g. to render
  // the home screen and the availability toggles). Assumes the backend
  // exposes this alongside the documented availability routes.
  getMyAvailabilities(token: string): Promise<Availability[]> {
    return request<Availability[]>("/availability/me", { token })
  }

  setAvailability(
    token: string,
    input: AvailabilityInput
  ): Promise<Availability> {
    return request<Availability>("/availability", {
      method: "POST",
      token,
      body: input,
    })
  }

  async removeAvailability(token: string, characterId: string): Promise<void> {
    await request(`/availability/${characterId}`, {
      method: "DELETE",
      token,
    })
  }

  // Not in the cahier des charges: being available for a job (e.g.
  // crafting for hire) is separate from character availability, so it
  // gets its own mirror of the /availability routes keyed by jobId.
  getMyJobAvailabilities(token: string): Promise<JobAvailability[]> {
    return request<JobAvailability[]>("/job-availability/me", { token })
  }

  setJobAvailability(
    token: string,
    input: JobAvailabilityInput
  ): Promise<JobAvailability> {
    return request<JobAvailability>("/job-availability", {
      method: "POST",
      token,
      body: input,
    })
  }

  async removeJobAvailability(token: string, jobId: string): Promise<void> {
    await request(`/job-availability/${jobId}`, {
      method: "DELETE",
      token,
    })
  }

  // Not in the cahier des charges: each result also carries `jobs`, the
  // helper's account-wide job levels for that server (see Job in
  // lib/types.ts), so the backend must join them in alongside the row.
  searchHelpers(filters: SearchFilters): Promise<HelperSearchResult[]> {
    const params = new URLSearchParams()
    if (filters.server) params.set("server", filters.server)
    if (filters.class) params.set("class", filters.class)
    if (filters.minLevel) params.set("minLevel", filters.minLevel)
    const query = params.toString()
    return request<HelperSearchResult[]>(
      `/helpers${query ? `?${query}` : ""}`
    )
  }

  // Not in the cahier des charges: a whole new endpoint for browsing jobs
  // that were explicitly marked available for hire (JobAvailability),
  // distinct from /helpers which lists characters.
  searchJobHelpers(filters: JobSearchFilters): Promise<JobSearchResult[]> {
    const params = new URLSearchParams({
      server: filters.server,
      job: filters.job,
    })
    return request<JobSearchResult[]>(`/job-helpers?${params.toString()}`)
  }
}
