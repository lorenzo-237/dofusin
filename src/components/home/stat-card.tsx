import { cn } from "@/lib/utils"

interface StatCardProps {
  label: string
  value: number
  accent?: "primary" | "accent"
}

export function StatCard({ label, value, accent = "primary" }: StatCardProps) {
  return (
    <div className="flex-1 rounded-2xl border border-border bg-card px-4 py-3.5">
      <div className="text-xs font-semibold text-muted-foreground">
        {label}
      </div>
      <div
        className={cn(
          "font-heading text-[26px] font-bold",
          accent === "primary" ? "text-primary" : "text-accent"
        )}
      >
        {value}
      </div>
    </div>
  )
}
