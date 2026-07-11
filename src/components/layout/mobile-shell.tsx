import type * as React from "react"

import { TitleBar } from "@/components/layout/title-bar"

/**
 * The design only ever specifies a 390x844 mobile screen ("pas de version
 * desktop prévue"). The Tauri window is sized to match, but this still caps
 * the width and centers the app so it also looks intentional in a regular
 * browser tab during `npm run dev`.
 */
export function MobileShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-svh w-full justify-center bg-muted">
      <div className="flex h-svh w-full max-w-107.5 flex-col overflow-hidden bg-background text-foreground shadow-xl">
        <TitleBar />
        {children}
      </div>
    </div>
  )
}
