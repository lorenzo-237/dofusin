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
    <div className="flex-1 px-2 py-2.5 text-center">
      <div
        className={cn(
          "font-heading text-lg font-bold",
          ACCENT_CLASSES[accent]
        )}
      >
        {value}
      </div>
      <div className="text-[10px] font-semibold text-muted-foreground">
        {label}
      </div>
    </div>
  )
}
