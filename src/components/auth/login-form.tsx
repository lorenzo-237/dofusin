import * as React from "react"
import { Link, useNavigate } from "@tanstack/react-router"

import { BrandHeader } from "@/components/auth/brand-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/context/auth-context"
import { ApiError } from "@/lib/api"

export function LoginForm() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [error, setError] = React.useState("")
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!username.trim() || !password.trim()) {
      setError("Merci de renseigner ton pseudo et ton mot de passe.")
      return
    }

    setError("")
    setIsSubmitting(true)
    try {
      await login({ username, password })
      await navigate({ to: "/" })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Une erreur est survenue.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-1 flex-col justify-center px-6.5 pt-6 pb-10">
      <BrandHeader />
      <h2 className="mb-4.5 font-heading text-[22px] font-bold">Connexion</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <Input
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          placeholder="Pseudo"
          aria-label="Pseudo"
          className="h-auto rounded-xl px-3.5 py-3.5 text-base"
        />
        <Input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Mot de passe"
          aria-label="Mot de passe"
          className="h-auto rounded-xl px-3.5 py-3.5 text-base"
        />
        {error ? (
          <p className="text-[13px] font-semibold text-destructive">{error}</p>
        ) : null}
        <Button
          type="submit"
          disabled={isSubmitting}
          className="mt-1.5 h-auto rounded-2xl py-3.5 font-heading text-base font-bold"
        >
          {isSubmitting ? "Connexion..." : "Se connecter"}
        </Button>
        <p className="mt-2.5 text-center text-sm text-muted-foreground">
          Pas de compte ?{" "}
          <Link to="/register" className="font-bold text-primary">
            Créer un compte
          </Link>
        </p>
      </form>
    </div>
  )
}
