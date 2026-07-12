import * as React from "react"
import { Check, MessageCircleHeart } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

function priceTag(price: number): string {
  return price > 0 ? `[Payant - ${price}k]` : "[Gratuit]"
}

interface CopyCommandButtonProps {
  characterName: string
  price: number
  className?: string
}

export function CopyCommandButton({
  characterName,
  price,
  className,
}: CopyCommandButtonProps) {
  const [open, setOpen] = React.useState(false)
  const [message, setMessage] = React.useState("")

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (next) setMessage("Bonjour, j'ai besoin d'aide.")
  }

  // Callback ref instead of a plain ref + effect: fires the instant the
  // textarea is actually attached to the DOM (the dialog unmounts/remounts
  // it on every open, portal timing included), so there's no risk of the
  // effect running before the node exists.
  const focusTextareaAtEnd = React.useCallback(
    (node: HTMLTextAreaElement | null) => {
      if (!node) return
      node.focus()
      const end = node.value.length
      node.setSelectionRange(end, end)
    },
    []
  )

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(
        `/w ${characterName} ${message} ${priceTag(price)}`
      )
    } catch {
      toast.error("Impossible de copier automatiquement.")
      return
    }
    toast.success("Message copié !")
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button
            variant="secondary"
            size="sm"
            className={cn("w-full gap-1.5", className)}
          />
        }
      >
        <MessageCircleHeart className="size-3.5" />
        Copier le message
      </DialogTrigger>
      <DialogContent initialFocus={false}>
        <DialogHeader>
          <DialogTitle>Message à {characterName}</DialogTitle>
          <DialogDescription>
            Complète le message avant de le copier : lieu, quête, ou toute
            autre info utile.
          </DialogDescription>
        </DialogHeader>
        <div>
          <div className="mb-1.5 text-sm font-semibold">
            /w {characterName}
          </div>
          <Textarea
            ref={focusTextareaAtEnd}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            rows={4}
            className="min-h-28"
            aria-label="Message à copier"
          />
          <div className="mt-1.5 text-sm font-semibold">
            {priceTag(price)}
          </div>
        </div>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>
            Annuler
          </DialogClose>
          <Button onClick={() => void handleCopy()} className="gap-1.5">
            <Check className="size-3.5" />
            Copier
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
