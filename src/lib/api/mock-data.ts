import type { HelperSearchResult, JobSearchResult } from "@/lib/types"

/**
 * Fictive helpers shown in search results alongside whatever the current
 * session's own characters made available today. Stands in for the rows a
 * real backend would return from `GET /api/helpers`.
 */
export const MOCK_HELPERS_POOL: HelperSearchResult[] = [
  { id: "h1", name: "Sör-Belna", server: "Emeraldia", class: "Eniripsa", level: 187, price: 0, jobs: [{ job: "Alchimiste", level: 92 }] },
  { id: "h2", name: "Kaal-Rutan", server: "Sablonoir", class: "Iop", level: 145, price: 3000, jobs: [{ job: "Forgeron", level: 60 }] },
  { id: "h3", name: "Mysha-Vent", server: "Brumeval", class: "Féca", level: 200, price: 0, jobs: [{ job: "Bûcheron", level: 100 }, { job: "Mineur", level: 84 }] },
  { id: "h4", name: "Doran-Feu", server: "Emeraldia", class: "Cra", level: 120, price: 1500, jobs: [] },
  { id: "h5", name: "Lyss-Ombre", server: "Nordhaven", class: "Sram", level: 160, price: 0, jobs: [{ job: "Mineur", level: 70 }] },
  { id: "h6", name: "Tessa-Lune", server: "Valorune", class: "Sadida", level: 90, price: 500, jobs: [] },
  { id: "h7", name: "Grunlek", server: "Sablonoir", class: "Sacrieur", level: 210, price: 0, jobs: [{ job: "Forgeron", level: 95 }, { job: "Bûcheron", level: 45 }] },
  { id: "h8", name: "Ariane-Belle", server: "Écarlate", class: "Eniripsa", level: 130, price: 2000, jobs: [{ job: "Alchimiste", level: 55 }] },
  { id: "h9", name: "Fenrix", server: "Brumeval", class: "Xélor", level: 175, price: 0, jobs: [] },
  { id: "h10", name: "Coralie-Vive", server: "Nordhaven", class: "Cra", level: 155, price: 1000, jobs: [{ job: "Mineur", level: 65 }] },
]

/**
 * Fictive job-for-hire listings shown in the "Métiers" search tab. Stands in
 * for the rows a real backend would return from `GET /api/job-helpers`.
 */
export const MOCK_JOB_HELPERS_POOL: JobSearchResult[] = [
  { id: "jh1", job: "Alchimiste", level: 92, price: 800, server: "Emeraldia", characterName: "Sör-Belna", characterClass: "Eniripsa", characterLevel: 187 },
  { id: "jh2", job: "Forgeron", level: 60, price: 0, server: "Sablonoir", characterName: "Kaal-Rutan", characterClass: "Iop", characterLevel: 145 },
  { id: "jh3", job: "Bûcheron", level: 100, price: 500, server: "Brumeval", characterName: "Mysha-Vent", characterClass: "Féca", characterLevel: 200 },
  { id: "jh4", job: "Mineur", level: 84, price: 0, server: "Brumeval", characterName: "Mysha-Vent", characterClass: "Féca", characterLevel: 200 },
  { id: "jh5", job: "Mineur", level: 70, price: 1200, server: "Nordhaven", characterName: "Lyss-Ombre", characterClass: "Sram", characterLevel: 160 },
]
