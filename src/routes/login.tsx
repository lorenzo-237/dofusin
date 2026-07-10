import { createFileRoute, redirect } from "@tanstack/react-router"

import { LoginForm } from "@/components/auth/login-form"
import { getSession } from "@/lib/auth-store"

export const Route = createFileRoute("/login")({
  beforeLoad: () => {
    if (getSession()) {
      throw redirect({ to: "/" })
    }
  },
  component: LoginForm,
})
