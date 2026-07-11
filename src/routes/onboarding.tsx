import { createFileRoute, redirect } from "@tanstack/react-router"

import { OnboardingForm } from "@/components/auth/onboarding-form"
import { getSession } from "@/lib/auth-store"

export const Route = createFileRoute("/onboarding")({
  beforeLoad: () => {
    if (!getSession()) {
      throw redirect({ to: "/login" })
    }
  },
  component: OnboardingForm,
})
