import { createFileRoute } from "@tanstack/react-router"

import { CreateHelpRequestCard } from "@/components/help-requests/create-help-request-card"
import { IncomingHelpRequestList } from "@/components/help-requests/incoming-help-request-list"
import { MyResponseList } from "@/components/help-requests/my-response-list"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/context/auth-context"

export const Route = createFileRoute("/_authenticated/help-requests")({
  staticData: { title: "Entraide" },
  component: HelpRequestsScreen,
})

function HelpRequestsScreen() {
  const { incomingHelpRequests, myHelpRequests, acceptedHelpRequests } =
    useAuth()

  return (
    <div className="pt-1">
      <Tabs defaultValue="incoming">
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
