import { createFileRoute, redirect } from "@tanstack/react-router"

import { RegisterForm } from "@/components/auth/register-form"
import { getSession } from "@/lib/auth-store"

export const Route = createFileRoute("/register")({
  beforeLoad: () => {
    if (getSession()) {
      throw redirect({ to: "/" })
    }
  },
  component: RegisterForm,
})
