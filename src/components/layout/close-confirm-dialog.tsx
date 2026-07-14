import * as React from "react"
import { isTauri } from "@tauri-apps/api/core"
import { getCurrentWindow } from "@tauri-apps/api/window"

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
import { useAuth } from "@/context/auth-context"

/**
 * Intercepts the window close request — the title bar's X button AND the
 * system tray's "Quitter" (routed through the same window-close flow on
 * the Rust side, see tray.rs) both end up here — to warn that closing
 * deactivates every currently-active availability. Nothing else does that
 * automatically: an Availability row just sits there with today's date
 * until the app is reopened, so without this the player would keep
 * showing up as available while not actually running the app.
 *
 * Only intercepts when the user is logged in — otherwise there's nothing
 * to confirm and the window closes immediately, no dialog. Always shows
 * once logged in, regardless of whether anything is actually active
 * (skipping it silently based on hidden state — "did I have an
 * availability on?" — made close behave unpredictably from one session to
 * the next); the description/deactivation call adapt to that instead.
 */
export function CloseConfirmDialog() {
  const { isAuthenticated, availabilities, jobAvailabilities, deactivateAll } =
    useAuth()
  const [open, setOpen] = React.useState(false)
  const [isClosing, setIsClosing] = React.useState(false)
  const hasActiveAvailability =
    availabilities.length + jobAvailabilities.length > 0

  // Read inside the listener via a ref instead of listing it as an effect
  // dep — the listener must be registered exactly once (re-registering on
  // every change risks missing the close event mid-transition), same
  // reasoning as goToHelpRequestsRef in auth-context.tsx.
  const isAuthenticatedRef = React.useRef(isAuthenticated)
  React.useEffect(() => {
    isAuthenticatedRef.current = isAuthenticated
  })

  React.useEffect(() => {
    if (!isTauri()) return
    const unlistenPromise = getCurrentWindow().onCloseRequested((event) => {
      if (!isAuthenticatedRef.current) return // Nothing to confirm pre-login.
      event.preventDefault()
      setOpen(true)
    })
    return () => {
      void unlistenPromise.then((unlisten) => unlisten())
    }
  }, [])

  const handleConfirm = async () => {
    setIsClosing(true)
    if (hasActiveAvailability) {
      try {
        await deactivateAll()
      } catch {
        // Best-effort — close anyway rather than trap the user in the app
        // over a failed network call.
      }
    }
    // destroy() (not close()) — close() would re-emit onCloseRequested and
    // hit this same listener again, looping forever.
    await getCurrentWindow().destroy()
  }

  // Stays open/available (nothing deactivated) — same as the existing
  // "Icônes système (tray)" minimize behavior in Paramètres, just reached
  // from this dialog instead of the minimize button.
  const handleMinimizeToTray = () => {
    setOpen(false)
    void getCurrentWindow().hide()
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Fermer DofusIn ?</AlertDialogTitle>
          <AlertDialogDescription>
            {hasActiveAvailability
              ? "Tes disponibilités (personnages et métiers) vont être désactivées. Tu pourras tout réactiver en un clic à ta prochaine connexion. Tu peux aussi réduire l'app dans les icônes système pour rester disponible."
              : "Tu peux aussi réduire l'app dans les icônes système au lieu de la fermer complètement."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction variant="outline" onClick={handleMinimizeToTray}>
            Réduire dans les icônes système
          </AlertDialogAction>
          <AlertDialogAction
            disabled={isClosing}
            onClick={() => void handleConfirm()}
          >
            {isClosing ? "Fermeture..." : "Fermer"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
