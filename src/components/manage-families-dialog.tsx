"use client"

import { useMemo, useState } from "react"
import { Trash2 } from 'lucide-react'

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"

export const ManageFamiliesPanel = ({
  families = [],
  members = [],
  onAddFamily = () => {},
  onRenameFamily = () => {},
  onDeleteFamily = () => {},
}: {
  families?: Family[]
  members?: Member[]
  onAddFamily?: (name: string) => void
  onRenameFamily?: (id: string, name: string) => void
  onDeleteFamily?: (id: string) => void
}) => {
  const [newName, setNewName] = useState("")
  const [edits, setEdits] = useState<Record<string, string>>({})

  const memberCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const f of families) counts[f.id] = 0
    for (const m of members) {
      if (m.familyId && counts[m.familyId] !== undefined) {
        counts[m.familyId]++
      }
    }
    return counts
  }, [families, members])

  function saveRename(id: string) {
    const name = (edits[id] ?? "").trim()
    if (name) {
      onRenameFamily(id, name)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="new-family">Add family</Label>
        <div className="mt-2 flex items-center gap-2">
          <Input
            id="new-family"
            placeholder="e.g., Williams"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <Button
            onClick={() => {
              const n = newName.trim()
              if (!n) return
              onAddFamily(n)
              setNewName("")
            }}
          >
            Add
          </Button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Deleting a family moves its members to “Unknown”.
        </p>
      </div>

      <Separator />

      <ScrollArea className="max-h-[50vh]">
        <div className="space-y-3">
          {families.length === 0 ? (
            <p className="text-sm text-muted-foreground">No families yet.</p>
          ) : (
            families
              .slice()
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((f) => {
                const count = memberCounts[f.id] ?? 0
                return (
                  <div
                    key={f.id}
                    className="flex flex-col gap-2 rounded-md border p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex flex-1 items-center gap-2">
                      <Input
                        defaultValue={f.name}
                        onChange={(e) =>
                          setEdits((prev) => ({ ...prev, [f.id]: e.target.value }))
                        }
                        aria-label={`Family name for ${f.name}`}
                      />
                      <span className="text-sm text-muted-foreground">
                        {count} member{count === 1 ? "" : "s"}
                      </span>
                    </div>
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="outline" onClick={() => saveRename(f.id)}>
                        Save
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => onDeleteFamily(f.id)}
                        aria-label={`Delete family ${f.name}`}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </div>
                )
              })
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
