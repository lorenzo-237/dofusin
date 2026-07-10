import { createFileRoute, Outlet, redirect, useMatches } from "@tanstack/react-router"

import { BottomNav } from "@/components/layout/bottom-nav"
import { ProtectedHeader } from "@/components/layout/protected-header"
import { getSession } from "@/lib/auth-store"

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: () => {
    if (!getSession()) {
      throw redirect({ to: "/login" })
    }
  },
  component: AuthenticatedLayout,
})

function AuthenticatedLayout() {
  const matches = useMatches()
  const title =
    [...matches].reverse().find((match) => match.staticData?.title)
      ?.staticData?.title ?? ""

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <ProtectedHeader title={title} />
      <div className="flex-1 overflow-y-auto px-5 pb-4">
        <Outlet />
      </div>
      <BottomNav />
    </div>
  )
}
