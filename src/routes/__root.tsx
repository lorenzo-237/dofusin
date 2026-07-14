import { createRootRoute, Outlet } from "@tanstack/react-router"
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools"

import { CloseConfirmDialog } from "@/components/layout/close-confirm-dialog"
import { MobileShell } from "@/components/layout/mobile-shell"
import { Toaster } from "@/components/ui/sonner"
import { AuthProvider } from "@/context/auth-context"

export const Route = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
  return (
    <AuthProvider>
      <MobileShell>
        <Outlet />
      </MobileShell>
      <Toaster position="top-center" richColors closeButton />
      <CloseConfirmDialog />
      {import.meta.env.DEV ? (
        <TanStackRouterDevtools position="top-left" />
      ) : null}
    </AuthProvider>
  )
}
