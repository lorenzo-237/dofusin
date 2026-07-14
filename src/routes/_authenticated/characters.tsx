import * as React from "react"
import { createFileRoute } from "@tanstack/react-router"
import { Plus } from "lucide-react"

import { CharacterForm } from "@/components/characters/character-form"
import { CharacterList } from "@/components/characters/character-list"
import { ServerSelect } from "@/components/shared/server-select"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { useAuth } from "@/context/auth-context"
import { getLastServer, setLastServer } from "@/lib/last-selection-store"
import type { Character, CharacterInput } from "@/lib/types"

export const Route = createFileRoute("/_authenticated/characters")({
  staticData: { title: "Mes personnages" },
  component: CharactersScreen,
})

function CharactersScreen() {
  const { characters, createCharacter, updateCharacter, deleteCharacter } =
    useAuth()

  const [server, setServer] = React.useState<string>(getLastServer())
  const [editingCharacter, setEditingCharacter] =
    React.useState<Character | null>(null)
  const [sheetOpen, setSheetOpen] = React.useState(false)

  const handleServerChange = (nextServer: string) => {
    setServer(nextServer)
    setLastServer(nextServer)
    setEditingCharacter(null)
    setSheetOpen(false)
  }

  const serverCharacters = characters.filter((c) => c.server === server)

  const handleAddClick = () => {
    setEditingCharacter(null)
    setSheetOpen(true)
  }

  const handleEditClick = (character: Character) => {
    setEditingCharacter(character)
    setSheetOpen(true)
  }

  const handleCancel = () => {
    setEditingCharacter(null)
    setSheetOpen(false)
  }

  const handleSubmit = async (values: CharacterInput) => {
    if (editingCharacter) {
      await updateCharacter(editingCharacter.id, values)
    } else {
      await createCharacter(values)
    }
    setEditingCharacter(null)
    setSheetOpen(false)
  }

  const handleDelete = async (character: Character) => {
    await deleteCharacter(character.id)
    setEditingCharacter((current) =>
      current?.id === character.id ? null : current
    )
  }

  return (
    <div className="pt-1">
      <ServerSelect
        value={server}
        onValueChange={handleServerChange}
        className="mb-4 h-auto w-full rounded-xl bg-muted px-2.5 py-2.5 text-sm"
      />

      <Button
        onClick={handleAddClick}
        className="mb-4 h-auto w-full gap-1.5 rounded-xl py-3 font-bold"
      >
        <Plus className="size-4" />
        Ajouter un personnage
      </Button>

      <CharacterList
        characters={serverCharacters}
        onEdit={handleEditClick}
        onDelete={handleDelete}
      />

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              {editingCharacter ? "Modifier le personnage" : "Ajouter un personnage"}
              <span className="ml-1.5 font-sans text-xs font-normal text-muted-foreground">
                sur {server}
              </span>
            </SheetTitle>
          </SheetHeader>
          <div className="px-6 pb-6">
            <CharacterForm
              key={editingCharacter?.id ?? "new"}
              server={server}
              editingCharacter={editingCharacter}
              onSubmit={handleSubmit}
              onCancelEdit={handleCancel}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
