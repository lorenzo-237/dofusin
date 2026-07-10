import * as React from "react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useAuth } from "@/context/auth-context"

interface ProtectedHeaderProps {
  title: string
}

export function ProtectedHeader({ title }: ProtectedHeaderProps) {
  const { logout } = useAuth()
  const [confirmOpen, setConfirmOpen] = React.useState(false)

  return (
    <header className="flex items-center justify-between px-5 pt-1.5 pb-3.5">
      <h1 className="font-heading text-[22px] font-bold">{title}</h1>
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogTrigger className="text-xs font-bold text-destructive">
          Déconnexion
        </AlertDialogTrigger>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Se déconnecter ?</AlertDialogTitle>
            <AlertDialogDescription>
              Tu devras te reconnecter pour retrouver tes personnages et tes
              disponibilités.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                logout()
                setConfirmOpen(false)
              }}
            >
              Se déconnecter
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </header>
  )
}
