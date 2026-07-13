import { Link } from "@tanstack/react-router"
import { UserPlus } from "lucide-react"

interface EmptyStateReminderProps {
  message: string
}

/**
 * Shown instead of the availability list when the selected server has no
 * character/job yet — character/job creation lives in the burger menu now
 * (not a persistent bottom-nav tab), so this is the only remaining path to
 * it from Disponibilité.
 */
export function EmptyStateReminder({ message }: EmptyStateReminderProps) {
  return (
    <Link
      to="/characters"
      className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border px-4 py-8 text-center"
    >
      <UserPlus className="size-6 text-muted-foreground" />
      <p className="text-[13px] text-muted-foreground">{message}</p>
      <span className="text-[13px] font-bold text-primary">
        Configurer mes personnages →
      </span>
    </Link>
  )
}
