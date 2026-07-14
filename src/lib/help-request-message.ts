import type {
  Availability,
  Character,
  HelpRequest,
  Job,
  JobAvailability,
} from "@/lib/types"

function formatPrice(
  availability: { free: boolean; price: number | null } | undefined
): number | undefined {
  if (!availability) return undefined
  return availability.free ? 0 : (availability.price ?? undefined)
}

function introMessage(label: string): string {
  return `Salut ${label} disponible`
}

/**
 * Pre-filled whisper template for the HELPER's own "Copier le message"
 * action, once a HelpRequest is actually ACCEPTED (AcceptedHelpRequestCard,
 * and the auto-open dialog right after accepting from "Reçues") — reads
 * the helper* fields the server resolved on accept. For the pre-accept
 * case (still in "Reçues"), see buildResponderIntroMessage below instead,
 * since those fields don't exist yet.
 *
 * Introduces the helper's class/job + level, since that's what's actually
 * useful to tell the requester, mirroring what a browsed search result
 * already communicates via CopyCommandButton elsewhere. The requester's
 * own copy action (MyHelpRequestCard) keeps the generic default — they're
 * not the one offering a service here.
 *
 * Price comes from the helper's own *live* Availability/JobAvailability
 * (looked up by helperCharacterId/helperJobId), not a snapshot stored on
 * HelpRequest — HelpRequest itself has no price field, and a live lookup
 * is always accurate even if the helper changed their price since
 * accepting (a stored snapshot could go stale).
 */
export function buildHelperIntroMessage(
  request: HelpRequest,
  availabilities: Availability[],
  jobAvailabilities: JobAvailability[]
): { defaultMessage: string; price: number | undefined } {
  const label =
    request.targetType === "job"
      ? `${request.helperJobName} niv ${request.helperJobLevel}`
      : `${request.helperCharacterClass} niv ${request.helperCharacterLevel}`

  const availability =
    request.targetType === "character"
      ? availabilities.find((a) => a.characterId === request.helperCharacterId)
      : jobAvailabilities.find((a) => a.jobId === request.helperJobId)

  return { defaultMessage: introMessage(label), price: formatPrice(availability) }
}

/**
 * Same template as buildHelperIntroMessage, but for "Reçues" *before*
 * accepting — built from the character/job the user is about to respond
 * with (IncomingHelpRequestCard already resolved this locally to render
 * the Accepter button), since the HelpRequest itself has no helper* data
 * yet at that point.
 */
export function buildResponderIntroMessage(
  responder:
    | { targetType: "character"; character: Character }
    | { targetType: "job"; job: Job },
  availabilities: Availability[],
  jobAvailabilities: JobAvailability[]
): { defaultMessage: string; price: number | undefined } {
  if (responder.targetType === "character") {
    const label = `${responder.character.class} niv ${responder.character.level}`
    const availability = availabilities.find(
      (a) => a.characterId === responder.character.id
    )
    return { defaultMessage: introMessage(label), price: formatPrice(availability) }
  }
  const label = `${responder.job.job} niv ${responder.job.level}`
  const availability = jobAvailabilities.find((a) => a.jobId === responder.job.id)
  return { defaultMessage: introMessage(label), price: formatPrice(availability) }
}
