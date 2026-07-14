import * as React from "react"
import { createFileRoute } from "@tanstack/react-router"

import { CharacterForm } from "@/components/characters/character-form"
import { CharacterList } from "@/components/characters/character-list"
import { ServerSelect } from "@/components/shared/server-select"
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

  const handleServerChange = (nextServer: string) => {
    setServer(nextServer)
    setLastServer(nextServer)
    setEditingCharacter(null)
  }

  const serverCharacters = characters.filter((c) => c.server === server)

  const handleSubmit = async (values: CharacterInput) => {
    if (editingCharacter) {
      await updateCharacter(editingCharacter.id, values)
      setEditingCharacter(null)
    } else {
      await createCharacter(values)
    }
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

      <CharacterList
        characters={serverCharacters}
        onEdit={setEditingCharacter}
        onDelete={handleDelete}
      />
      <CharacterForm
        key={editingCharacter?.id ?? "new"}
        server={server}
        editingCharacter={editingCharacter}
        onSubmit={handleSubmit}
        onCancelEdit={() => setEditingCharacter(null)}
      />
    </div>
  )
}
