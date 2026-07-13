import * as React from "react"
import { AlertTriangle } from "lucide-react"
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
import { useAuth } from "@/context/auth-context"
import { ApiError } from "@/lib/api"

interface DisputeDialogProps {
  requestId: string
}

export function DisputeDialog({ requestId }: DisputeDialogProps) {
  const { disputeHelpRequest } = useAuth()
  const [open, setOpen] = React.useState(false)
  const [reason, setReason] = React.useState("")
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (next) setReason("")
  }

  const handleSubmit = async () => {
    const trimmed = reason.trim()
    if (!trimmed) return
    setIsSubmitting(true)
    try {
      await disputeHelpRequest(requestId, trimmed)
      toast.success("Litige ouvert.")
      setOpen(false)
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Une erreur est survenue."
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className="h-auto flex-1 gap-1 rounded-xl py-2 text-xs font-bold text-destructive hover:text-destructive"
          />
        }
      >
        <AlertTriangle className="size-3.5" />
        Litige
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ouvrir un litige</DialogTitle>
          <DialogDescription>
            Explique pourquoi tu n'as finalement pas été aidé — ça ajoute un
            strike à l'aidant, sans lui reprendre l'xp déjà reçue.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          rows={4}
          className="min-h-28"
          placeholder="Motif du litige..."
          aria-label="Motif du litige"
        />
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>
            Annuler
          </DialogClose>
          <Button
            variant="destructive"
            disabled={!reason.trim() || isSubmitting}
            onClick={() => void handleSubmit()}
          >
            {isSubmitting ? "..." : "Confirmer le litige"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
