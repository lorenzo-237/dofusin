import { HandHeart } from "lucide-react"

import { AcceptedHelpRequestCard } from "@/components/help-requests/accepted-help-request-card"
import { MyHelpRequestCard } from "@/components/help-requests/my-help-request-card"
import type { HelpRequest } from "@/lib/types"

interface MyResponseListProps {
  myHelpRequests: HelpRequest[]
  acceptedHelpRequests: HelpRequest[]
}

type TaggedRequest =
  | { role: "requester"; request: HelpRequest }
  | { role: "helper"; request: HelpRequest }

export function MyResponseList({
  myHelpRequests,
  acceptedHelpRequests,
}: MyResponseListProps) {
  const items: TaggedRequest[] = [
    ...myHelpRequests.map(
      (request): TaggedRequest => ({ role: "requester", request })
    ),
    ...acceptedHelpRequests.map(
      (request): TaggedRequest => ({ role: "helper", request })
    ),
  ].sort((a, b) => b.request.createdAt.localeCompare(a.request.createdAt))

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border px-4 py-8 text-center">
        <HandHeart className="size-6 text-muted-foreground" />
        <p className="text-[13px] text-muted-foreground">
          Tes demandes et tes aides apparaîtront ici.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {items.map(({ role, request }) =>
        role === "requester" ? (
          <MyHelpRequestCard key={`requester-${request.id}`} request={request} />
        ) : (
          <AcceptedHelpRequestCard key={`helper-${request.id}`} request={request} />
        )
      )}
    </div>
  )
}
