import * as React from "react"
import { useNavigate } from "@tanstack/react-router"

import { BrandHeader } from "@/components/auth/brand-header"
import type { RegisterAccountValues } from "@/components/auth/register-account-form"
import { RegisterAccountForm } from "@/components/auth/register-account-form"
import { RegisterCharacterForm } from "@/components/auth/register-character-form"
import { useAuth } from "@/context/auth-context"
import { ApiError } from "@/lib/api"
import type { CharacterInput } from "@/lib/types"

export function RegisterForm() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [account, setAccount] = React.useState<RegisterAccountValues | null>(
    null
  )
  const [error, setError] = React.useState("")
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const handleAccountSubmit = (values: RegisterAccountValues) => {
    setAccount(values)
  }

  const handleCharacterSubmit = async (character: CharacterInput) => {
    if (!account) return
    setError("")
    setIsSubmitting(true)
    try {
      await register({ ...account, character })
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
      {account === null ? (
        <>
          <h2 className="mb-4.5 font-heading text-[22px] font-bold">
            Créer un compte
          </h2>
          <RegisterAccountForm onSubmit={handleAccountSubmit} />
        </>
      ) : (
        <>
          <h2 className="mb-1 font-heading text-[22px] font-bold">
            Ton premier personnage
          </h2>
          <p className="mb-4.5 text-[13px] text-muted-foreground">
            Obligatoire pour finir l'inscription.
          </p>
          <RegisterCharacterForm
            isSubmitting={isSubmitting}
            submitError={error}
            onSubmit={handleCharacterSubmit}
          />
        </>
      )}
    </div>
  )
}
