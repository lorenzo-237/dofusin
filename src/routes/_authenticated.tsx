import { createFileRoute, Outlet, redirect } from "@tanstack/react-router"

import { BottomNav } from "@/components/layout/bottom-nav"
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
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto px-5 pt-4 pb-4">
        <Outlet />
      </div>
      <BottomNav />
    </div>
  )
}
