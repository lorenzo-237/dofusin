export const SERVERS = [
  "Emeraldia",
  "Sablonoir",
  "Brumeval",
  "Écarlate",
  "Nordhaven",
  "Valorune",
] as const

export type Server = (typeof SERVERS)[number]

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

// TODO(user): liste de départ à compléter avec les vrais métiers du jeu.
export const JOBS = ["Alchimiste", "Bûcheron", "Forgeron", "Mineur"] as const

export type JobName = (typeof JOBS)[number]

export const JOB_COLORS: Record<JobName, string> = {
  Alchimiste: "#8E5FBF",
  Bûcheron: "#6B8E4E",
  Forgeron: "#B5651D",
  Mineur: "#7A7A7A",
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
