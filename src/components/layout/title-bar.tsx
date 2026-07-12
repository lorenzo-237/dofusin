import * as React from "react"
import { isTauri } from "@tauri-apps/api/core"
import { getCurrentWindow } from "@tauri-apps/api/window"
import { useMatches, useNavigate } from "@tanstack/react-router"
import { LogOut, Menu, Minus, Monitor, Moon, Sun, X } from "lucide-react"

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

/**
 * Single top bar doing double duty as the custom Tauri title bar
 * (`decorations: false` in tauri.conf.json — dragging via
 * `data-tauri-drag-region`, minimize/close only rendered/wired when
 * `isTauri()`) and the in-app header (current page title, centered via
 * absolute positioning so it stays centered regardless of how wide the
 * left/right groups are; burger menu with theme switch + logout, only
 * shown once authenticated). Always rendered — including in a plain
 * browser tab during `npm run dev` — so the page title and burger menu
 * are still reachable there, just without window controls.
 */
export function TitleBar() {
  const { user, logout } = useAuth()
  const { theme, setTheme } = useTheme()
  const matches = useMatches()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = React.useState(false)
  const [confirmOpen, setConfirmOpen] = React.useState(false)

  const title =
    [...matches].reverse().find((match) => match.staticData?.title)
      ?.staticData?.title ?? ""

  return (
    <div
      data-tauri-drag-region
      className="relative flex h-10 flex-none items-center justify-between border-b border-border bg-background pr-1 pl-3 select-none"
    >
      <img
        data-tauri-drag-region
        src="/assets/icon.svg"
        alt="DofusIn"
        className="size-5 shrink-0 rounded-[5px]"
      />

      {title ? (
        <div className="pointer-events-none absolute inset-x-0 text-center font-heading text-sm font-bold text-foreground">
          {title}
        </div>
      ) : null}

      <div className="flex items-center gap-0.5">
        {user ? (
          <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
            <DropdownMenuTrigger
              aria-label="Menu"
              className="flex size-7 items-center justify-center rounded-lg text-foreground/70 hover:bg-muted hover:text-foreground"
            >
              <Menu className="size-4" />
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
        ) : null}

        {isTauri() ? (
          <>
            <button
              type="button"
              onClick={() => void getCurrentWindow().minimize()}
              aria-label="Réduire"
              className="flex size-7 items-center justify-center rounded-lg text-foreground/70 hover:bg-muted hover:text-foreground"
            >
              <Minus className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => void getCurrentWindow().close()}
              aria-label="Fermer"
              className="flex size-7 items-center justify-center rounded-lg text-foreground/70 hover:bg-destructive hover:text-white"
            >
              <X className="size-4" />
            </button>
          </>
        ) : null}
      </div>

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
                // beforeLoad guards only run on navigation, not reactively
                // when the session clears — without this, the current
                // authenticated route stays mounted until a hard refresh.
                void navigate({ to: "/login" })
              }}
            >
              Se déconnecter
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
