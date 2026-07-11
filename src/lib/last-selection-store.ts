import { JOBS, SERVERS } from "@/lib/game-data"

const SERVER_KEY = "dofus-dispo:last-server"
const JOB_KEY = "dofus-dispo:last-job"

/**
 * Remembers the last server/job the user picked anywhere in the app (Mes
 * personnages, Disponibilité, Recherche, inscription share the same
 * "server" memory; Mes métiers and Recherche > Métiers share "job") so
 * forms/filters default to it instead of always resetting to SERVERS[0]/
 * JOBS[0]. Falls back to the first item if nothing's stored yet, or if the
 * stored value no longer exists in the current list.
 */
export function getLastServer(): string {
  const stored = localStorage.getItem(SERVER_KEY)
  return stored && (SERVERS as readonly string[]).includes(stored)
    ? stored
    : SERVERS[0]
}

export function setLastServer(server: string): void {
  localStorage.setItem(SERVER_KEY, server)
}

export function getLastJob(): string {
  const stored = localStorage.getItem(JOB_KEY)
  return stored && (JOBS as readonly string[]).includes(stored)
    ? stored
    : JOBS[0]
}

export function setLastJob(job: string): void {
  localStorage.setItem(JOB_KEY, job)
}
