import * as React from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

function buildWhisperCommand(characterName: string): string {
  return `/w ${characterName} Bonjour, j'ai besoin d'aide.`
}

interface CopyCommandButtonProps {
  characterName: string
  className?: string
}

export function CopyCommandButton({
  characterName,
  className,
}: CopyCommandButtonProps) {
  const [justCopied, setJustCopied] = React.useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(buildWhisperCommand(characterName))
    } catch {
      toast.error("Impossible de copier automatiquement.")
      return
    }
    toast.success("Commande copiée !")
    setJustCopied(true)
    window.setTimeout(() => setJustCopied(false), 1600)
  }

  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={handleCopy}
      className={cn("w-full", className)}
    >
      {justCopied ? "Copié !" : "Copier /w"}
    </Button>
  )
}
