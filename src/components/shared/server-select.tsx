import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SERVERS } from "@/lib/game-data"

interface ServerSelectProps {
  value: string
  onValueChange: (value: string) => void
  className?: string
}

export function ServerSelect({
  value,
  onValueChange,
  className,
}: ServerSelectProps) {
  const items = SERVERS.map((server) => ({ value: server, label: server }))

  return (
    <Select
      items={items}
      value={value}
      onValueChange={(next) => {
        if (next) onValueChange(next)
      }}
    >
      <SelectTrigger className={className}>
        <SelectValue placeholder="Serveur" />
      </SelectTrigger>
      <SelectContent>
        {SERVERS.map((server) => (
          <SelectItem key={server} value={server}>
            {server}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
