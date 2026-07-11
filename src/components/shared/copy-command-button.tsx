import * as React from "react"
import { Check, MessageCircleHeart } from "lucide-react"
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
      className={cn("w-full gap-1.5", className)}
    >
      {justCopied ? (
        <>
          <Check className="size-3.5" />
          Copié !
        </>
      ) : (
        <>
          <MessageCircleHeart className="size-3.5" />
          Copier le message
        </>
      )}
    </Button>
  )
}
