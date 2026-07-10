import { characterInitial, classColor, classIcon } from "@/lib/game-data"
import { cn } from "@/lib/utils"

const SIZE_CLASSES = {
  sm: "size-[30px] text-xs",
  md: "size-[34px] text-sm",
} as const

interface ClassAvatarProps {
  name: string
  characterClass: string
  size?: keyof typeof SIZE_CLASSES
  className?: string
}

export function ClassAvatar({
  name,
  characterClass,
  size = "md",
  className,
}: ClassAvatarProps) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-lg font-heading font-bold text-white",
        SIZE_CLASSES[size],
        className
      )}
      style={{ backgroundColor: classColor(characterClass) }}
    >
      {characterInitial(name)}
    </div>
  )
}

export function ClassIcon({
  characterClass,
  className,
}: {
  characterClass: string
  className?: string
}) {
  return (
    <img
      src={classIcon(characterClass)}
      alt={characterClass}
      className={cn("size-4 shrink-0 object-contain", className)}
    />
  )
}

export function ClassDot({
  characterClass,
  className,
}: {
  characterClass: string
  className?: string
}) {
  return (
    <div
      className={cn("size-[9px] shrink-0 rounded-full", className)}
      style={{ backgroundColor: classColor(characterClass) }}
    />
  )
}
