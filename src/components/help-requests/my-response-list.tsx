import * as React from "react"
import { ChevronDown, HandHeart } from "lucide-react"

import { AcceptedHelpRequestCard } from "@/components/help-requests/accepted-help-request-card"
import { MyHelpRequestCard } from "@/components/help-requests/my-help-request-card"
import { cn } from "@/lib/utils"
import type { HelpRequest } from "@/lib/types"

interface MyResponseListProps {
  myHelpRequests: HelpRequest[]
  acceptedHelpRequests: HelpRequest[]
  myHelpRequestsHasMore: boolean
  acceptedHelpRequestsHasMore: boolean
  isLoadingMoreMyHelpRequests: boolean
  isLoadingMoreAcceptedHelpRequests: boolean
  onLoadMoreMyHelpRequests: () => void
  onLoadMoreAcceptedHelpRequests: () => void
}

type Role = "demandes" | "aides"

const ROLES: { value: Role; label: string }[] = [
  { value: "demandes", label: "Demandes" },
  { value: "aides", label: "Aides" },
]

function isActive(request: HelpRequest): boolean {
  return request.status === "OPEN" || request.status === "ACCEPTED"
}

/**
 * Split by role (toggle, not a merged/sorted list) and by state — demandes
 * and aides can each pile up over time, and mixing them into one
 * chronological list made it hard to tell which was which at a glance.
 * Resolved requests (VALIDATED/DISPUTED/EXPIRED) go under a collapsed
 * "Historique" section so the list doesn't just keep growing forever —
 * only what still needs attention (OPEN/ACCEPTED) stays always visible.
 */
export function MyResponseList({
  myHelpRequests,
  acceptedHelpRequests,
  myHelpRequestsHasMore,
  acceptedHelpRequestsHasMore,
  isLoadingMoreMyHelpRequests,
  isLoadingMoreAcceptedHelpRequests,
  onLoadMoreMyHelpRequests,
  onLoadMoreAcceptedHelpRequests,
}: MyResponseListProps) {
  const [role, setRole] = React.useState<Role>("demandes")
  const [historyOpen, setHistoryOpen] = React.useState(false)

  if (myHelpRequests.length === 0 && acceptedHelpRequests.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border px-4 py-8 text-center">
        <HandHeart className="size-6 text-muted-foreground" />
        <p className="text-[13px] text-muted-foreground">
          Tes demandes et tes aides apparaîtront ici.
        </p>
      </div>
    )
  }

  const items = role === "demandes" ? myHelpRequests : acceptedHelpRequests
  const active = items.filter(isActive)
  const resolved = items.filter((r) => !isActive(r))
  const CardComponent = role === "demandes" ? MyHelpRequestCard : AcceptedHelpRequestCard
  const hasMore = role === "demandes" ? myHelpRequestsHasMore : acceptedHelpRequestsHasMore
  const isLoadingMore =
    role === "demandes" ? isLoadingMoreMyHelpRequests : isLoadingMoreAcceptedHelpRequests
  const onLoadMore =
    role === "demandes" ? onLoadMoreMyHelpRequests : onLoadMoreAcceptedHelpRequests

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-1.5 rounded-xl bg-muted p-1">
        {ROLES.map((r) => {
          const count =
            r.value === "demandes" ? myHelpRequests.length : acceptedHelpRequests.length
          return (
            <button
              key={r.value}
              type="button"
              aria-pressed={role === r.value}
              onClick={() => {
                setRole(r.value)
                setHistoryOpen(false)
              }}
              className={cn(
                "flex-1 rounded-lg py-1.5 text-[13px] font-bold transition-colors",
                role === r.value
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground"
              )}
            >
              {r.label}
              {count > 0 ? ` (${count})` : ""}
            </button>
          )
        })}
      </div>

      {items.length === 0 ? (
        <p className="py-6 text-center text-[13px] text-muted-foreground">
          {role === "demandes"
            ? "Aucune demande pour l'instant."
            : "Aucune aide pour l'instant."}
        </p>
      ) : (
        <>
          {active.length > 0 ? (
            <div className="flex flex-col gap-3">
              {active.map((request) => (
                <CardComponent key={request.id} request={request} />
              ))}
            </div>
          ) : null}

          {resolved.length > 0 ? (
            <div>
              <button
                type="button"
                onClick={() => setHistoryOpen((prev) => !prev)}
                className="flex w-full items-center justify-between rounded-xl bg-muted px-3 py-2 text-[13px] font-bold text-muted-foreground"
              >
                Historique ({resolved.length})
                <ChevronDown
                  className={cn(
                    "size-4 transition-transform",
                    historyOpen ? "rotate-180" : ""
                  )}
                />
              </button>
              {historyOpen ? (
                <div className="mt-2 flex flex-col gap-3">
                  {resolved.map((request) => (
                    <CardComponent key={request.id} request={request} />
                  ))}
                  {hasMore ? (
                    <button
                      type="button"
                      onClick={onLoadMore}
                      disabled={isLoadingMore}
                      className="rounded-xl border border-dashed border-border py-2 text-[13px] font-bold text-muted-foreground disabled:opacity-60"
                    >
                      {isLoadingMore ? "Chargement..." : "Charger plus"}
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}
        </>
      )}
    </div>
  )
}
