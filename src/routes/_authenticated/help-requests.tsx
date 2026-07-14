import { createFileRoute } from "@tanstack/react-router"
import { History, Inbox } from "lucide-react"

import { IncomingHelpRequestList } from "@/components/help-requests/incoming-help-request-list"
import { MyResponseList } from "@/components/help-requests/my-response-list"
import { CopyCommandButton } from "@/components/shared/copy-command-button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/context/auth-context"
import { buildHelperIntroMessage } from "@/lib/help-request-message"

// "Demander" moved to Accueil (see routes/_authenticated/index.tsx) for
// quick access — CreateHelpRequestCard no longer lives here.
export type HelpRequestsTab = "incoming" | "mine"

const TABS: HelpRequestsTab[] = ["incoming", "mine"]

function isHelpRequestsTab(value: unknown): value is HelpRequestsTab {
  return typeof value === "string" && TABS.includes(value as HelpRequestsTab)
}

export const Route = createFileRoute("/_authenticated/help-requests")({
  staticData: { title: "Entraide" },
  validateSearch: (
    search: Record<string, unknown>
  ): { tab?: HelpRequestsTab } => ({
    tab: isHelpRequestsTab(search.tab) ? search.tab : undefined,
  }),
  component: HelpRequestsScreen,
})

function HelpRequestsScreen() {
  const {
    incomingHelpRequests,
    myHelpRequests,
    acceptedHelpRequests,
    myHelpRequestsHasMore,
    acceptedHelpRequestsHasMore,
    isLoadingMoreMyHelpRequests,
    isLoadingMoreAcceptedHelpRequests,
    loadMoreMyHelpRequests,
    loadMoreAcceptedHelpRequests,
    availabilities,
    jobAvailabilities,
    lastAcceptedHelpRequest,
    clearLastAcceptedHelpRequest,
  } = useAuth()
  const { tab } = Route.useSearch()

  return (
    <div className="pt-1">
      {/* key remounts the Tabs (uncontrolled) whenever a notification click
          navigates here with a different `tab` search param — same pattern
          as CharacterForm's key={editingCharacter?.id ?? "new"}, see
          CLAUDE.md. Manual in-page tab clicks don't touch the URL, so they
          never trigger this. */}
      <Tabs key={tab ?? "default"} defaultValue={tab ?? "incoming"}>
        <TabsList className="mb-4 w-full">
          <TabsTrigger value="incoming" className="flex-1">
            <Inbox className="opacity-70" />
            Reçues
            {incomingHelpRequests.length > 0
              ? ` (${incomingHelpRequests.length})`
              : ""}
          </TabsTrigger>
          <TabsTrigger value="mine" className="flex-1">
            <History className="opacity-70" />
            Mes réponses
          </TabsTrigger>
        </TabsList>

        <TabsContent value="incoming">
          <IncomingHelpRequestList requests={incomingHelpRequests} />
        </TabsContent>

        <TabsContent value="mine">
          <MyResponseList
            myHelpRequests={myHelpRequests}
            acceptedHelpRequests={acceptedHelpRequests}
            myHelpRequestsHasMore={myHelpRequestsHasMore}
            acceptedHelpRequestsHasMore={acceptedHelpRequestsHasMore}
            isLoadingMoreMyHelpRequests={isLoadingMoreMyHelpRequests}
            isLoadingMoreAcceptedHelpRequests={isLoadingMoreAcceptedHelpRequests}
            onLoadMoreMyHelpRequests={() => void loadMoreMyHelpRequests()}
            onLoadMoreAcceptedHelpRequests={() =>
              void loadMoreAcceptedHelpRequests()
            }
          />
        </TabsContent>
      </Tabs>

      {/* Auto-opens right after accepting a request from "Reçues" — lives
          here (route level) rather than in the incoming-request card, which
          unmounts the instant the accepted request leaves
          incomingHelpRequests (same render pass as the accept). No visible
          trigger button (isControlled), the dialog itself is the whole UI. */}
      {lastAcceptedHelpRequest ? (
        <CopyCommandButton
          characterName={lastAcceptedHelpRequest.requesterCharacterName}
          {...buildHelperIntroMessage(
            lastAcceptedHelpRequest,
            availabilities,
            jobAvailabilities
          )}
          open={lastAcceptedHelpRequest !== null}
          onOpenChange={(open) => {
            if (!open) clearLastAcceptedHelpRequest()
          }}
        />
      ) : null}
    </div>
  )
}
