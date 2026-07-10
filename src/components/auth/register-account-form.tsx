import * as React from "react"
import { Link } from "@tanstack/react-router"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export interface RegisterAccountValues {
  username: string
  password: string
}

interface RegisterAccountFormProps {
  defaultValues?: RegisterAccountValues
  onSubmit: (values: RegisterAccountValues) => void
}

export function RegisterAccountForm({
  defaultValues,
  onSubmit,
}: RegisterAccountFormProps) {
  const [username, setUsername] = React.useState(defaultValues?.username ?? "")
  const [password, setPassword] = React.useState(defaultValues?.password ?? "")
  const [confirm, setConfirm] = React.useState(defaultValues?.password ?? "")
  const [error, setError] = React.useState("")

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!username.trim() || !password.trim()) {
      setError("Pseudo et mot de passe requis.")
      return
    }
    if (password !== confirm) {
      setError("Les mots de passe ne correspondent pas.")
      return
    }
    setError("")
    onSubmit({ username: username.trim(), password })
  }

  return (
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
      <Input
        type="password"
        value={confirm}
        onChange={(event) => setConfirm(event.target.value)}
        placeholder="Confirmer le mot de passe"
        aria-label="Confirmer le mot de passe"
        className="h-auto rounded-xl px-3.5 py-3.5 text-base"
      />
      {error ? (
        <p className="text-[13px] font-semibold text-destructive">{error}</p>
      ) : null}
      <Button
        type="submit"
        className="mt-1.5 h-auto rounded-2xl py-3.5 font-heading text-base font-bold"
      >
        Continuer
      </Button>
      <p className="mt-2.5 text-center text-sm text-muted-foreground">
        Déjà un compte ?{" "}
        <Link to="/login" className="font-bold text-primary">
          Se connecter
        </Link>
      </p>
    </form>
  )
}
