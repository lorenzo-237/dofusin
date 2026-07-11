import * as React from "react"
import { useNavigate } from "@tanstack/react-router"

import { BrandHeader } from "@/components/auth/brand-header"
import { RegisterCharacterForm } from "@/components/auth/register-character-form"
import { useAuth } from "@/context/auth-context"
import { ApiError } from "@/lib/api"
import type { CharacterInput } from "@/lib/types"

/**
 * Shown right after a Discord account's very first login, when it doesn't
 * have a single character yet (see the redirect in
 * routes/_authenticated.tsx) — Discord replaced the old two-step
 * register flow, but the cahier des charges still requires a first
 * character before using the rest of the app.
 */
export function OnboardingForm() {
  const { createCharacter } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = React.useState("")
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const handleSubmit = async (character: CharacterInput) => {
    setError("")
    setIsSubmitting(true)
    try {
      await createCharacter(character)
      await navigate({ to: "/" })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Une erreur est survenue.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-1 flex-col justify-center overflow-y-auto px-6.5 pt-6 pb-10">
      <BrandHeader />
      <h2 className="mb-1 font-heading text-[22px] font-bold">
        Ton premier personnage
      </h2>
      <p className="mb-4.5 text-[13px] text-muted-foreground">
        Obligatoire pour finir l'inscription.
      </p>
      <RegisterCharacterForm
        isSubmitting={isSubmitting}
        submitError={error}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
