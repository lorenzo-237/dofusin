const MINIMIZE_BEHAVIOR_KEY = "dofus-dispo:minimize-behavior"

export type MinimizeBehavior = "taskbar" | "tray"

/**
 * Read fresh at click-time by the minimize button (title-bar.tsx) rather
 * than kept in React state — nothing needs to react live to this changing
 * (unlike theme-provider.tsx, which re-applies a CSS class), it only
 * matters the next time the button is pressed.
 */
export function getMinimizeBehavior(): MinimizeBehavior {
  return localStorage.getItem(MINIMIZE_BEHAVIOR_KEY) === "tray"
    ? "tray"
    : "taskbar"
}

export function setMinimizeBehavior(value: MinimizeBehavior): void {
  localStorage.setItem(MINIMIZE_BEHAVIOR_KEY, value)
}
