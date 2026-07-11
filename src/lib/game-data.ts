export const SERVERS_BY_CATEGORY = {
  Dofus: [
    "Brial",
    "Dakal",
    "Draconiros",
    "Hell Mina",
    "Imagiro",
    "Kourial",
    "Mikhal",
    "Ombre",
    "Orumkam",
    "Rafal",
    "Salar",
    "Tal Kasha",
    "Tylezia",
  ],
  "Dofus Retro": ["Allisteria", "Boune", "Fallanster"],
  "Dofus Touch": ["Blair", "Kelerog", "Talok", "Tiliwan"],
} as const satisfies Record<string, readonly string[]>

export type ServerCategory = keyof typeof SERVERS_BY_CATEGORY

export const SERVERS = [
  ...SERVERS_BY_CATEGORY.Dofus,
  ...SERVERS_BY_CATEGORY["Dofus Retro"],
  ...SERVERS_BY_CATEGORY["Dofus Touch"],
] as const

export type Server = (typeof SERVERS)[number]

function categoryOf<C extends string>(
  byCategory: Record<C, readonly string[]>,
  item: string
): C {
  const entry = (Object.entries(byCategory) as [C, readonly string[]][]).find(
    ([, items]) => items.includes(item)
  )
  return entry?.[0] ?? (Object.keys(byCategory)[0] as C)
}

export function serverCategory(server: string): ServerCategory {
  return categoryOf(SERVERS_BY_CATEGORY, server)
}

export const CLASSES = [
  "Cra",
  "Ecaflip",
  "Eliotrope",
  "Eniripsa",
  "Enutrof",
  "Féca",
  "Forgelance",
  "Huppermage",
  "Iop",
  "Osamodas",
  "Ouginak",
  "Pandawa",
  "Roublard",
  "Sacrieur",
  "Sadida",
  "Sram",
  "Steamer",
  "Xélor",
  "Zobal",
] as const

export type CharacterClass = (typeof CLASSES)[number]

export const JOBS_BY_CATEGORY = {
  Craft: [
    "Bijoutier",
    "Bricoleur",
    "Cordonnier",
    "Eleveur",
    "Façonneur",
    "Forgeron",
    "Sculpteur",
    "Tailleur",
  ],
  Forgemagie: [
    "Cordomage",
    "Costumage",
    "Façomage",
    "Forgemage",
    "Joaillomage",
    "Sculptemage",
  ],
  Récolte: [
    "Alchimiste",
    "Bûcheron",
    "Chasseur",
    "Mineur",
    "Paysan",
    "Pêcheur",
  ],
} as const satisfies Record<string, readonly string[]>

export type JobCategory = keyof typeof JOBS_BY_CATEGORY

export const JOBS = [
  ...JOBS_BY_CATEGORY.Craft,
  ...JOBS_BY_CATEGORY.Forgemagie,
  ...JOBS_BY_CATEGORY.Récolte,
] as const

export type JobName = (typeof JOBS)[number]

export function jobCategory(job: string): JobCategory {
  return categoryOf(JOBS_BY_CATEGORY, job)
}

export const JOB_COLORS: Record<JobName, string> = {
  // Forgemagie
  Cordomage: "#7C5CD9",
  Costumage: "#A66BC9",
  Façomage: "#B07CC6",
  Forgemage: "#8E5FBF",
  Joaillomage: "#9B59B6",
  Sculptemage: "#6B4FA0",
  // Récolte
  Alchimiste: "#5FA3A3",
  Bûcheron: "#6B8E4E",
  Chasseur: "#4E8B6B",
  Mineur: "#7A7A7A",
  Paysan: "#8AA84E",
  Pêcheur: "#4A90A4",
  // Craft
  Bijoutier: "#D9A227",
  Bricoleur: "#D97706",
  Cordonnier: "#A0522D",
  Eleveur: "#8A6D3B",
  Façonneur: "#C97B3D",
  Forgeron: "#B5651D",
  Sculpteur: "#B3563F",
  Tailleur: "#C0533B",
}

export function jobColor(job: string): string {
  return JOB_COLORS[job as JobName] ?? "#8A8271"
}

export const CLASS_COLORS: Record<CharacterClass, string> = {
  Cra: "#4E9A5D",
  Ecaflip: "#E0A63A",
  Eliotrope: "#7C5CD9",
  Eniripsa: "#5FA3A3",
  Enutrof: "#8A6D3B",
  Féca: "#5A7FE0",
  Forgelance: "#708090",
  Huppermage: "#9B59B6",
  Iop: "#C0533B",
  Osamodas: "#4E8B6B",
  Ouginak: "#A0522D",
  Pandawa: "#D97706",
  Roublard: "#6B5B95",
  Sacrieur: "#B3563F",
  Sadida: "#6FA85A",
  Sram: "#52525B",
  Steamer: "#C97B3D",
  Xélor: "#C9A227",
  Zobal: "#D9738E",
}

export function classColor(cls: string): string {
  return CLASS_COLORS[cls as CharacterClass] ?? "#8A8271"
}

const COMBINING_DIACRITICS_PATTERN = new RegExp("[\\u0300-\\u036f]", "g")

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(COMBINING_DIACRITICS_PATTERN, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

// Icons live in `public/classes/<slug>.png` (see public/classes/README.md)
// so they can be dropped in without any code change.
export function classIcon(cls: string): string {
  return `/classes/${slugify(cls)}.png`
}

export function characterInitial(name: string): string {
  return (name || "?").charAt(0).toUpperCase()
}
