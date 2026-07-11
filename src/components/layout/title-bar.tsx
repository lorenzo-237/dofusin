import { isTauri } from "@tauri-apps/api/core"
import { getCurrentWindow } from "@tauri-apps/api/window"
import { Minus, X } from "lucide-react"

/**
 * The native OS title bar is disabled (`decorations: false` in
 * tauri.conf.json) so it can match the app palette instead of the
 * system chrome. Only rendered inside the Tauri shell — in a plain
 * browser tab (`npm run dev`) there is no window to drag/close, so this
 * renders nothing there.
 */
export function TitleBar() {
  if (!isTauri()) return null

  return (
    <div
      data-tauri-drag-region
      className="flex h-8 flex-none items-center justify-between bg-primary pr-1 pl-3 select-none"
    >
      <div
        data-tauri-drag-region
        className="flex items-center gap-1.5 font-heading text-xs font-bold text-primary-foreground"
      >
        <div
          data-tauri-drag-region
          className="flex size-3.5 items-center justify-center rounded-[3px] bg-primary-foreground/20 text-[8px]"
        >
          DD
        </div>
        Dofus-Dispo
      </div>
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          onClick={() => void getCurrentWindow().minimize()}
          aria-label="Réduire"
          className="flex size-6 items-center justify-center rounded text-primary-foreground/80 hover:bg-primary-foreground/15 hover:text-primary-foreground"
        >
          <Minus className="size-3.5" />
        </button>
        <button
          type="button"
          onClick={() => void getCurrentWindow().close()}
          aria-label="Fermer"
          className="flex size-6 items-center justify-center rounded text-primary-foreground/80 hover:bg-destructive hover:text-white"
        >
          <X className="size-3.5" />
        </button>
      </div>
    </div>
  )
}
