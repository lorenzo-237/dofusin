import { CategoryPicker } from "@/components/shared/category-picker"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  SERVERS_BY_CATEGORY,
  serverCategory,
  type ServerCategory,
} from "@/lib/game-data"

interface ServerSelectProps {
  value: string
  onValueChange: (value: string) => void
  className?: string
}

const SERVER_CATEGORIES = Object.keys(
  SERVERS_BY_CATEGORY
) as ServerCategory[]

export function ServerSelect({
  value,
  onValueChange,
  className,
}: ServerSelectProps) {
  const category = serverCategory(value)
  const servers = SERVERS_BY_CATEGORY[category]
  const items = servers.map((server) => ({ value: server, label: server }))

  return (
    <div className="flex flex-col gap-1.5">
      <CategoryPicker
        categories={SERVER_CATEGORIES}
        value={category}
        onValueChange={(nextCategory) =>
          onValueChange(SERVERS_BY_CATEGORY[nextCategory][0])
        }
      />
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
          {servers.map((server) => (
            <SelectItem key={server} value={server}>
              {server}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
