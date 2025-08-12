"use client"

import { useMemo, useState } from "react"
import { Trash2 } from 'lucide-react'

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export const ManageMembersPanel = ({
  families = [],
  members = [],
  onAddMember = () => {},
  onDeleteMember = () => {},
  onReassignFamily = () => {},
  onRenameMember = () => {},
}: {
  families?: Family[]
  members?: Member[]
  onAddMember?: (m: { firstName: string; lastName: string; familyId?: string | null }) => void
  onDeleteMember?: (id: string) => void
  onReassignFamily?: (memberId: string, familyId?: string | null) => void
  onRenameMember?: (memberId: string, firstName: string, lastName: string) => void
}) => {
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [familyId, setFamilyId] = useState<string | null | undefined>(undefined)

  // For inline edits
  const [editNames, setEditNames] = useState<Record<string, { firstName: string; lastName: string }>>({})

  const sortedFamilies = useMemo(
    () => families.slice().sort((a, b) => a.name.localeCompare(b.name)),
    [families]
  )

  function handleAdd() {
    const fn = firstName.trim()
    const ln = lastName.trim()
    if (!fn || !ln) return
    onAddMember({ firstName: fn, lastName: ln, familyId: familyId ?? null })
    setFirstName("")
    setLastName("")
    setFamilyId(undefined)
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="member-first-name">First name</Label>
          <Input
            id="member-first-name"
            placeholder="e.g., David"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="member-last-name">Last name</Label>
          <Input
            id="member-last-name"
            placeholder="e.g., Miller"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label>Family (optional)</Label>
          <Select
            value={familyId ?? ""}
            onValueChange={(v) => setFamilyId(v === "" ? null : v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Unassigned (Unknown)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Unassigned">Unassigned (Unknown)</SelectItem>
              {sortedFamilies.map((f) => (
                <SelectItem key={f.id} value={f.id}>
                  {f.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="sm:col-span-2">
          <Button onClick={handleAdd}>Add member</Button>
        </div>
      </div>

      <div className="max-h-[50vh] overflow-y-auto">
        <div className="mt-4 space-y-3">
          {members.length === 0 ? (
            <p className="text-sm text-muted-foreground">No members yet.</p>
          ) : (
            members
              .slice()
              .sort((a, b) => {
                const an = `${a.lastName} ${a.firstName}`.toLowerCase()
                const bn = `${b.lastName} ${b.firstName}`.toLowerCase()
                return an.localeCompare(bn)
              })
              .map((m) => {
                const edit = editNames[m.id] ?? { firstName: m.firstName, lastName: m.lastName }
                return (
                  <div
                    key={m.id}
                    className="grid gap-2 rounded-md border p-3 sm:grid-cols-[1fr_1fr_minmax(180px,220px)_auto] sm:items-center sm:gap-3"
                  >
                    <Input
                      defaultValue={m.firstName}
                      onChange={(e) =>
                        setEditNames((prev) => ({
                          ...prev,
                          [m.id]: { ...prev[m.id], firstName: e.target.value ?? "" },
                        }))
                      }
                      aria-label={`First name for ${m.firstName} ${m.lastName}`}
                    />
                    <Input
                      defaultValue={m.lastName}
                      onChange={(e) =>
                        setEditNames((prev) => ({
                          ...prev,
                          [m.id]: { ...prev[m.id], lastName: e.target.value ?? "" },
                        }))
                      }
                      aria-label={`Last name for ${m.firstName} ${m.lastName}`}
                    />
                    <Select
                      value={m.familyId ?? ""}
                      onValueChange={(v) => onReassignFamily(m.id, v === "" ? null : v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Unassigned (Unknown)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Unassigned">Unassigned (Unknown)</SelectItem>
                        {sortedFamilies.map((f) => (
                          <SelectItem key={f.id} value={f.id}>
                            {f.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onRenameMember(m.id, edit.firstName ?? m.firstName, edit.lastName ?? m.lastName)}
                      >
                        Save
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => onDeleteMember(m.id)}
                        aria-label={`Delete member ${m.firstName} ${m.lastName}`}
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
      </div>
    </div>
  )
}
