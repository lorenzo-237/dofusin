import type { ApiClient } from "@/lib/api/api-client"
import { HttpApiClient } from "@/lib/api/http-api-client"
import { MockApiClient } from "@/lib/api/mock-api-client"

export type { ApiClient } from "@/lib/api/api-client"
export { ApiError } from "@/lib/api/api-client"

let cachedClient: ApiClient | undefined

/**
 * Strategy factory: everything else in the app talks to `ApiClient` only,
 * so switching between fictive data and the real REST API is just a matter
 * of setting VITE_API_STRATEGY (see .env.example) — no code changes needed.
 */
export function getApiClient(): ApiClient {
  if (!cachedClient) {
    const strategy = import.meta.env.VITE_API_STRATEGY ?? "mock"
    cachedClient = strategy === "http" ? new HttpApiClient() : new MockApiClient()
  }
  return cachedClient
}
