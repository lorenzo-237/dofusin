/* eslint-disable react-refresh/only-export-components */
import * as React from "react"

import { getApiClient } from "@/lib/api"
import { getSession, setSession, subscribeSession } from "@/lib/auth-store"
import type {
  Availability,
  AvailabilityInput,
  Character,
  CharacterInput,
  Job,
  JobAvailability,
  JobAvailabilityInput,
  JobInput,
  LoginInput,
  RegisterInput,
  User,
} from "@/lib/types"

interface AuthContextValue {
  user: User | null
  token: string | null
  isAuthenticated: boolean

  characters: Character[]
  jobs: Job[]
  availabilities: Availability[]
  jobAvailabilities: JobAvailability[]

  login: (input: LoginInput) => Promise<void>
  register: (input: RegisterInput) => Promise<void>
  logout: () => void

  createCharacter: (input: CharacterInput) => Promise<void>
  updateCharacter: (id: string, input: CharacterInput) => Promise<void>
  deleteCharacter: (id: string) => Promise<void>

  setJob: (input: JobInput) => Promise<void>
  deleteJob: (id: string) => Promise<void>

  setAvailability: (input: AvailabilityInput) => Promise<void>
  removeAvailability: (characterId: string) => Promise<void>

  setJobAvailability: (input: JobAvailabilityInput) => Promise<void>
  removeJobAvailability: (jobId: string) => Promise<void>
}

const AuthContext = React.createContext<AuthContextValue | undefined>(
  undefined
)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const session = React.useSyncExternalStore(subscribeSession, getSession)
  const [characters, setCharacters] = React.useState<Character[]>([])
  const [jobs, setJobs] = React.useState<Job[]>([])
  const [availabilities, setAvailabilities] = React.useState<Availability[]>(
    []
  )
  const [jobAvailabilities, setJobAvailabilities] = React.useState<
    JobAvailability[]
  >([])

  const token = session?.token ?? null

  React.useEffect(() => {
    if (!token) return
    let cancelled = false
    const client = getApiClient()
    void Promise.all([
      client.getCharacters(token),
      client.getJobs(token),
      client.getMyAvailabilities(token),
      client.getMyJobAvailabilities(token),
    ]).then(
      ([
        nextCharacters,
        nextJobs,
        nextAvailabilities,
        nextJobAvailabilities,
      ]) => {
        if (cancelled) return
        setCharacters(nextCharacters)
        setJobs(nextJobs)
        setAvailabilities(nextAvailabilities)
        setJobAvailabilities(nextJobAvailabilities)
      }
    )
    return () => {
      cancelled = true
    }
  }, [token])

  const login = React.useCallback(async (input: LoginInput) => {
    const nextSession = await getApiClient().login(input)
    setSession(nextSession)
  }, [])

  const register = React.useCallback(async (input: RegisterInput) => {
    const nextSession = await getApiClient().register(input)
    setSession(nextSession)
  }, [])

  const logout = React.useCallback(() => {
    setSession(null)
    setCharacters([])
    setJobs([])
    setAvailabilities([])
    setJobAvailabilities([])
  }, [])

  const requireToken = React.useCallback(() => {
    if (!token) throw new Error("Non authentifié.")
    return token
  }, [token])

  const createCharacter = React.useCallback(
    async (input: CharacterInput) => {
      const activeToken = requireToken()
      const character = await getApiClient().createCharacter(
        activeToken,
        input
      )
      setCharacters((prev) => [...prev, character])
    },
    [requireToken]
  )

  const updateCharacter = React.useCallback(
    async (id: string, input: CharacterInput) => {
      const activeToken = requireToken()
      const updated = await getApiClient().updateCharacter(
        activeToken,
        id,
        input
      )
      setCharacters((prev) => prev.map((c) => (c.id === id ? updated : c)))
    },
    [requireToken]
  )

  const deleteCharacter = React.useCallback(
    async (id: string) => {
      const activeToken = requireToken()
      await getApiClient().deleteCharacter(activeToken, id)
      setCharacters((prev) => prev.filter((c) => c.id !== id))
      setAvailabilities((prev) => prev.filter((a) => a.characterId !== id))
    },
    [requireToken]
  )

  const setJob = React.useCallback(
    async (input: JobInput) => {
      const activeToken = requireToken()
      const job = await getApiClient().setJob(activeToken, input)
      setJobs((prev) => [...prev.filter((j) => j.id !== job.id), job])
    },
    [requireToken]
  )

  const deleteJob = React.useCallback(
    async (id: string) => {
      const activeToken = requireToken()
      await getApiClient().deleteJob(activeToken, id)
      setJobs((prev) => prev.filter((j) => j.id !== id))
      setJobAvailabilities((prev) => prev.filter((a) => a.jobId !== id))
    },
    [requireToken]
  )

  const setAvailability = React.useCallback(
    async (input: AvailabilityInput) => {
      const activeToken = requireToken()
      const availability = await getApiClient().setAvailability(
        activeToken,
        input
      )
      setAvailabilities((prev) => [
        ...prev.filter((a) => a.characterId !== input.characterId),
        availability,
      ])
    },
    [requireToken]
  )

  const removeAvailability = React.useCallback(
    async (characterId: string) => {
      const activeToken = requireToken()
      await getApiClient().removeAvailability(activeToken, characterId)
      setAvailabilities((prev) =>
        prev.filter((a) => a.characterId !== characterId)
      )
    },
    [requireToken]
  )

  const setJobAvailability = React.useCallback(
    async (input: JobAvailabilityInput) => {
      const activeToken = requireToken()
      const availability = await getApiClient().setJobAvailability(
        activeToken,
        input
      )
      setJobAvailabilities((prev) => [
        ...prev.filter((a) => a.jobId !== input.jobId),
        availability,
      ])
    },
    [requireToken]
  )

  const removeJobAvailability = React.useCallback(
    async (jobId: string) => {
      const activeToken = requireToken()
      await getApiClient().removeJobAvailability(activeToken, jobId)
      setJobAvailabilities((prev) => prev.filter((a) => a.jobId !== jobId))
    },
    [requireToken]
  )

  const value = React.useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      token,
      isAuthenticated: session != null,
      characters,
      jobs,
      availabilities,
      jobAvailabilities,
      login,
      register,
      logout,
      createCharacter,
      updateCharacter,
      deleteCharacter,
      setJob,
      deleteJob,
      setAvailability,
      removeAvailability,
      setJobAvailability,
      removeJobAvailability,
    }),
    [
      session,
      token,
      characters,
      jobs,
      availabilities,
      jobAvailabilities,
      login,
      register,
      logout,
      createCharacter,
      updateCharacter,
      deleteCharacter,
      setJob,
      deleteJob,
      setAvailability,
      removeAvailability,
      setJobAvailability,
      removeJobAvailability,
    ]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = React.useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
