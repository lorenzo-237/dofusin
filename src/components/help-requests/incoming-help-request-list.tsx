import { LifeBuoy } from "lucide-react"

import { IncomingHelpRequestCard } from "@/components/help-requests/incoming-help-request-card"
import type { HelpRequest } from "@/lib/types"

interface IncomingHelpRequestListProps {
  requests: HelpRequest[]
}

export function IncomingHelpRequestList({
  requests,
}: IncomingHelpRequestListProps) {
  if (requests.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border px-4 py-8 text-center">
        <LifeBuoy className="size-6 text-muted-foreground" />
        <p className="text-[13px] text-muted-foreground">
          Aucune demande pour l'instant. On te notifie dès que quelqu'un a
          besoin d'aide.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {requests.map((request) => (
        <IncomingHelpRequestCard key={request.id} request={request} />
      ))}
    </div>
  )
}
