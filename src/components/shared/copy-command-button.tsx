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

function priceTag(price: number | undefined): string {
  if (price === undefined) return ""
  return price > 0 ? `[Payant - ${price}k]` : "[Gratuit]"
}

interface CopyCommandButtonProps {
  characterName: string
  // Absent for contexts with no price concept (e.g. Entraide's HelpRequest,
  // which isn't a paid/free transaction) — the [Gratuit]/[Payant] tag is
  // simply omitted rather than defaulting to one or the other.
  price?: number
  className?: string
  // Uncontrolled (internal state) by default, same as before — pass both
  // to drive it externally instead (e.g. auto-opening right after an
  // accept, from a component that outlives the triggering list item).
  open?: boolean
  onOpenChange?: (open: boolean) => void
  // Overrides the generic "Bonjour, j'ai besoin d'aide." starting text —
  // e.g. the Entraide helper side pre-fills a "Salut [classe/métier] niv N
  // disponible" intro instead, see help-request-message.ts.
  defaultMessage?: string
}

export function CopyCommandButton({
  characterName,
  price,
  className,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
  defaultMessage = "Bonjour, j'ai besoin d'aide.",
}: CopyCommandButtonProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false)
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : uncontrolledOpen
  // Seeded from defaultMessage at mount (not "") — matters for controlled
  // usage (e.g. the Entraide auto-open dialog), where the dialog can start
  // out already open=true from its very first render; nothing ever calls
  // handleOpenChange in that case (only user-driven toggles do), so relying
  // solely on that to seed the message would leave it blank. Uncontrolled
  // callers still get it reset correctly on every open via
  // handleOpenChange below, this only changes the very first value.
  const [message, setMessage] = React.useState(defaultMessage)

  const handleOpenChange = (next: boolean) => {
    if (isControlled) {
      setControlledOpen?.(next)
    } else {
      setUncontrolledOpen(next)
    }
    if (next) setMessage(defaultMessage)
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
    const tag = priceTag(price)
    const text = tag
      ? `/w ${characterName} ${message} ${tag}`
      : `/w ${characterName} ${message}`
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      toast.error("Impossible de copier automatiquement.")
      return
    }
    toast.success("Message copié !")
    handleOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {isControlled ? null : (
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
      )}
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
          {price !== undefined ? (
            <div className="mt-1.5 text-sm font-semibold">
              {priceTag(price)}
            </div>
          ) : null}
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
