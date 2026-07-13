import { createFileRoute } from "@tanstack/react-router"

import { CreateHelpRequestCard } from "@/components/help-requests/create-help-request-card"
import { IncomingHelpRequestList } from "@/components/help-requests/incoming-help-request-list"
import { MyResponseList } from "@/components/help-requests/my-response-list"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/context/auth-context"

export type HelpRequestsTab = "create" | "incoming" | "mine"

const TABS: HelpRequestsTab[] = ["create", "incoming", "mine"]

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
  const { incomingHelpRequests, myHelpRequests, acceptedHelpRequests } =
    useAuth()
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
          <TabsTrigger value="create" className="flex-1">
            Demander
          </TabsTrigger>
          <TabsTrigger value="incoming" className="flex-1">
            Reçues
            {incomingHelpRequests.length > 0
              ? ` (${incomingHelpRequests.length})`
              : ""}
          </TabsTrigger>
          <TabsTrigger value="mine" className="flex-1">
            Mes réponses
          </TabsTrigger>
        </TabsList>

        <TabsContent value="create">
          <CreateHelpRequestCard />
        </TabsContent>

        <TabsContent value="incoming">
          <IncomingHelpRequestList requests={incomingHelpRequests} />
        </TabsContent>

        <TabsContent value="mine">
          <MyResponseList
            myHelpRequests={myHelpRequests}
            acceptedHelpRequests={acceptedHelpRequests}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
