import * as React from "react"
import { LogOut, Menu, Monitor, Moon, Sun } from "lucide-react"

import { useTheme, type Theme } from "@/components/theme-provider"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/context/auth-context"

interface ProtectedHeaderProps {
  title: string
}

export function ProtectedHeader({ title }: ProtectedHeaderProps) {
  const { logout } = useAuth()
  const { theme, setTheme } = useTheme()
  const [menuOpen, setMenuOpen] = React.useState(false)
  const [confirmOpen, setConfirmOpen] = React.useState(false)

  return (
    <header className="flex items-center justify-between px-5 pt-1.5 pb-3.5">
      <h1 className="font-heading text-[22px] font-bold">{title}</h1>

      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger
          aria-label="Menu"
          className="flex size-8 items-center justify-center rounded-xl text-foreground/70 hover:bg-muted hover:text-foreground"
        >
          <Menu className="size-4.5" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuRadioGroup
            value={theme}
            onValueChange={(value) => setTheme(value as Theme)}
          >
            <DropdownMenuLabel>Thème</DropdownMenuLabel>
            <DropdownMenuRadioItem value="light">
              <Sun className="opacity-70" />
              Clair
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="dark">
              <Moon className="opacity-70" />
              Sombre
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="system">
              <Monitor className="opacity-70" />
              Système
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={() => setConfirmOpen(true)}
          >
            <LogOut className="opacity-70" />
            Déconnexion
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
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
