import * as React from "react"
import { Check, Loader2 } from "lucide-react"

import { Input } from "@/components/ui/input"
import { useDebouncedCallback } from "@/hooks/use-debounced-callback"

interface AvailabilityPriceInputProps {
  price: number | null
  onPriceChange: (price: number | null) => Promise<void>
}

type SaveStatus = "idle" | "saving" | "saved"

/**
 * Mounted only while "Payant" is selected (see the callers), so its lazy
 * initial state always starts from the current price and typing doesn't
 * fire a save on every keystroke — only 500ms after the user stops.
 */
export function AvailabilityPriceInput({
  price,
  onPriceChange,
}: AvailabilityPriceInputProps) {
  const [text, setText] = React.useState(() =>
    price != null ? String(price) : ""
  )
  const [status, setStatus] = React.useState<SaveStatus>("idle")

  const debouncedSave = useDebouncedCallback((nextPrice: number | null) => {
    onPriceChange(nextPrice)
      .then(() => setStatus("saved"))
      .catch(() => setStatus("idle"))
  }, 500)

  return (
    <div className="relative">
      <Input
        value={text}
        onChange={(event) => {
          const nextText = event.target.value
          setText(nextText)
          setStatus("saving")
          debouncedSave(nextText === "" ? null : Number(nextText))
        }}
        placeholder="Tarif (kamas)"
        aria-label="Tarif (kamas)"
        className="h-auto rounded-[9px] bg-muted px-2.5 py-2.5 pr-8 text-sm"
      />
      {status === "saving" ? (
        <Loader2 className="absolute top-1/2 right-2.5 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
      ) : null}
      {status === "saved" ? (
        <Check className="absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-primary" />
      ) : null}
    </div>
  )
}
