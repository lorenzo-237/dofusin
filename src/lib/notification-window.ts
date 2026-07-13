import { isTauri } from "@tauri-apps/api/core"
import { getCurrentWindow, primaryMonitor } from "@tauri-apps/api/window"
import { WebviewWindow } from "@tauri-apps/api/webviewWindow"

const POPUP_LABEL = "notification-popup"
const POPUP_WIDTH = 340
const POPUP_HEIGHT = 96
const MARGIN = 16

/**
 * Branded popup window shown for WS notifications (see auth-context.tsx)
 * when the main window isn't focused — replaces the native OS notification,
 * which only shows the correct app name/icon once the app is actually
 * installed (tauri-plugin-notification falls back to the launching
 * terminal's identity in dev, a known Windows AUMID limitation). Points at
 * public/notification.html directly (a plain static page, not a route in
 * the SPA/router) since it doesn't need auth/data/WS wiring — see the
 * withGlobalTauri comment in that file.
 */
export async function showNotificationPopup(
  title: string,
  body: string
): Promise<void> {
  if (!isTauri()) return
  try {
    // The in-app toast (auth-context.tsx) already covers the foreground
    // case — this popup is only for when the main window isn't visible.
    if (await getCurrentWindow().isFocused()) return

    const existing = await WebviewWindow.getByLabel(POPUP_LABEL)
    if (existing) await existing.close()

    const monitor = await primaryMonitor()
    const scale = monitor?.scaleFactor ?? 1
    const workWidth = monitor ? monitor.size.width / scale : 1280
    const workHeight = monitor ? monitor.size.height / scale : 800

    const params = new URLSearchParams({ title, body })
    new WebviewWindow(POPUP_LABEL, {
      url: `/notification.html?${params.toString()}`,
      width: POPUP_WIDTH,
      height: POPUP_HEIGHT,
      x: Math.round(workWidth - POPUP_WIDTH - MARGIN),
      y: Math.round(workHeight - POPUP_HEIGHT - MARGIN),
      decorations: false,
      alwaysOnTop: true,
      skipTaskbar: true,
      resizable: false,
      focus: false,
      shadow: true,
    })
  } catch {
    // Best-effort — a failed popup should never break WS event handling.
  }
}
