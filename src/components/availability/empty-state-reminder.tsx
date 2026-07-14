import { Link } from "@tanstack/react-router"
import { UserPlus } from "lucide-react"

interface EmptyStateReminderProps {
  message: string
  to: "/characters" | "/jobs"
  ctaLabel: string
}

/**
 * Shown instead of the availability list when the selected server has no
 * character/job yet — character/job creation lives in the burger menu now
 * (not a persistent bottom-nav tab, and split across two pages since Mes
 * personnages/Mes métiers), so this is the only remaining path to it from
 * Disponibilité. `to`/`ctaLabel` differ between the two tabs (see
 * availability.tsx) since each points at its own page now.
 */
export function EmptyStateReminder({
  message,
  to,
  ctaLabel,
}: EmptyStateReminderProps) {
  return (
    <Link
      to={to}
      className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border px-4 py-8 text-center"
    >
      <UserPlus className="size-6 text-muted-foreground" />
      <p className="text-[13px] text-muted-foreground">{message}</p>
      <span className="text-[13px] font-bold text-primary">{ctaLabel}</span>
    </Link>
  )
}
