import * as React from "react"
import { useNavigate } from "@tanstack/react-router"

import { BrandHeader } from "@/components/auth/brand-header"
import { Button } from "@/components/ui/button"
import { CancelledLoginError, useAuth } from "@/context/auth-context"
import { ApiError } from "@/lib/api"

export function LoginForm() {
  const { loginWithDiscord, cancelDiscordLogin } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = React.useState("")
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const handleClick = async () => {
    setError("")
    setIsSubmitting(true)
    try {
      await loginWithDiscord()
      await navigate({ to: "/" })
    } catch (err) {
      if (err instanceof CancelledLoginError) return
      setError(err instanceof ApiError ? err.message : "Une erreur est survenue.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    cancelDiscordLogin()
  }

  return (
    <div className="flex flex-1 flex-col justify-center px-6.5 pt-6 pb-10">
      <BrandHeader />
      <h2 className="mb-4.5 font-heading text-[22px] font-bold">Connexion</h2>
      <p className="mb-4.5 text-[13px] text-muted-foreground">
        Connecte-toi avec ton compte Discord pour accéder à DofusIn.
      </p>
      <Button
        onClick={() => void handleClick()}
        disabled={isSubmitting}
        className="h-auto rounded-2xl bg-[#5865F2] py-3.5 font-heading text-base font-bold text-white hover:bg-[#5865F2]/90"
      >
        {isSubmitting ? "Connexion..." : "Se connecter avec Discord"}
      </Button>
      {isSubmitting ? (
        <Button
          type="button"
          variant="ghost"
          onClick={handleCancel}
          className="mt-2 h-auto py-2.5 font-bold text-muted-foreground"
        >
          Annuler
        </Button>
      ) : null}
      {error ? (
        <p className="mt-3 text-[13px] font-semibold text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  )
}
