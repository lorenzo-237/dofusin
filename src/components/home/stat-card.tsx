import { cn } from "@/lib/utils"

const ACCENT_CLASSES = {
  primary: "text-primary",
  accent: "text-accent",
  info: "text-chart-3",
} as const

interface StatCardProps {
  label: string
  value: number
  accent?: keyof typeof ACCENT_CLASSES
}

export function StatCard({ label, value, accent = "primary" }: StatCardProps) {
  return (
    <div className="flex-1 rounded-2xl border border-border bg-card px-3.5 py-3.5">
      <div className="text-xs font-semibold text-muted-foreground">
        {label}
      </div>
      <div className={cn("font-heading text-2xl font-bold", ACCENT_CLASSES[accent])}>
        {value}
      </div>
    </div>
  )
}
