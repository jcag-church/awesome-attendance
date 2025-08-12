"use client"

import { useMemo, useState } from "react"
import { CalendarDays, CheckCircle2, Users, Settings2, UserPlus } from 'lucide-react'

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { ManageMembersPanel } from "./manage-members-dialog"
import { ManageFamiliesPanel } from "./manage-families-dialog"


type Family = {
  id: string
  name: string
}

type Member = {
  id: string
  firstName: string
  lastName: string
  familyId?: string | null
}

type AttendanceMap = Record<string, boolean>

function formatToday(date = new Date()) {
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

function getServiceType(date = new Date()) {
  const day = date.getDay() // 0=Sun, 3=Wed
  if (day === 0) return "Sunday Service"
  if (day === 3) return "IPM Mid-week Service"
  return "Other Day"
}

const UNKNOWN_FAMILY_ID = "unknown"

function makeId(prefix: string = "id") {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}_${Date.now().toString(36)}`
}

const initialFamilies: Family[] = [
  { id: "fam_smith", name: "Smith" },
  { id: "fam_johnson", name: "Johnson" },
  { id: "fam_garcia", name: "Garcia" },
]

const initialMembers: Member[] = [
  { id: "mem_1", firstName: "John", lastName: "Smith", familyId: "fam_smith" },
  { id: "mem_2", firstName: "Jane", lastName: "Smith", familyId: "fam_smith" },
  { id: "mem_3", firstName: "Emily", lastName: "Smith", familyId: "fam_smith" },

  { id: "mem_4", firstName: "Michael", lastName: "Johnson", familyId: "fam_johnson" },
  { id: "mem_5", firstName: "Sarah", lastName: "Johnson", familyId: "fam_johnson" },

  { id: "mem_6", firstName: "Carlos", lastName: "Garcia", familyId: "fam_garcia" },

  // Members without a family association (will appear under "Unknown")
  { id: "mem_7", firstName: "Ava", lastName: "Lopez", familyId: null },
  { id: "mem_8", firstName: "Noah", lastName: "Lee" }, // undefined familyId also treated as Unknown
]

export default function AttendanceApp() {
  // Core state
  const [families, setFamilies] = useState<Family[]>(initialFamilies)
  const [members, setMembers] = useState<Member[]>(initialMembers)
  const [attendance, setAttendance] = useState<AttendanceMap>({})

  // Dialog state
  const [openFamilies, setOpenFamilies] = useState(false)
  const [openMembers, setOpenMembers] = useState(false)

  // Date and service info
  const today = useMemo(() => new Date(), [])
  const todayStr = formatToday(today)
  const serviceType = getServiceType(today)

  // Derived: group members by family, ensuring "Unknown"
  const grouped = useMemo(() => {
    const byId: Record<string, Family> = {}
    for (const f of families) byId[f.id] = f

    // Include all families + Unknown
    const buckets: { id: string; name: string; members: Member[] }[] = [
      ...families.map((f) => ({ id: f.id, name: f.name, members: [] as Member[] })),
      { id: UNKNOWN_FAMILY_ID, name: "Unknown", members: [] as Member[] },
    ]

    const bucketById: Record<string, (typeof buckets)[number]> = {}
    for (const b of buckets) bucketById[b.id] = b

    for (const m of members) {
      const fid = m.familyId ?? UNKNOWN_FAMILY_ID
      const bucket = bucketById[fid] ?? bucketById[UNKNOWN_FAMILY_ID]
      bucket.members.push(m)
    }

    // Sort members alphabetically within each bucket
    for (const b of buckets) {
      b.members.sort((a, b2) => {
        const an = `${a.lastName} ${a.firstName}`.toLowerCase()
        const bn = `${b2.lastName} ${b2.firstName}`.toLowerCase()
        return an.localeCompare(bn)
      })
    }

    return buckets
  }, [families, members])

  const totalMembers = members.length
  const totalPresent = useMemo(
    () => members.reduce((acc, m) => acc + (attendance[m.id] ? 1 : 0), 0),
    [members, attendance]
  )

  // Actions: attendance
  function toggleAttendance(memberId: string, value: boolean | "indeterminate") {
    setAttendance((prev) => ({ ...prev, [memberId]: value === true }))
  }

  function markAllInFamily(familyId: string, value: boolean) {
    const bucket = grouped.find((b) => b.id === familyId)
    if (!bucket) return
    setAttendance((prev) => {
      const next = { ...prev }
      for (const m of bucket.members) {
        next[m.id] = value
      }
      return next
    })
  }

  function clearAllAttendance() {
    setAttendance({})
  }

  // Actions: families
  function addFamily(name: string) {
    const trimmed = name.trim()
    if (!trimmed) return
    const newFamily: Family = { id: makeId("fam"), name: trimmed }
    setFamilies((prev) => [...prev, newFamily])
  }

  function renameFamily(id: string, name: string) {
    setFamilies((prev) => prev.map((f) => (f.id === id ? { ...f, name: name.trim() || f.name } : f)))
  }

  function deleteFamily(id: string) {
    // Move its members to Unknown
    setMembers((prev) =>
      prev.map((m) => (m.familyId === id ? { ...m, familyId: null } : m))
    )
    setFamilies((prev) => prev.filter((f) => f.id !== id))
  }

  // Actions: members
  function addMember(partial: { firstName: string; lastName: string; familyId?: string | null }) {
    const fn = partial.firstName.trim()
    const ln = partial.lastName.trim()
    if (!fn || !ln) return
    const newMember: Member = {
      id: makeId("mem"),
      firstName: fn,
      lastName: ln,
      familyId: partial.familyId ?? null,
    }
    setMembers((prev) => [...prev, newMember])
  }

  function updateMemberFamily(memberId: string, familyId?: string | null) {
    setMembers((prev) => prev.map((m) => (m.id === memberId ? { ...m, familyId: familyId ?? null } : m)))
  }

  function updateMemberName(memberId: string, firstName: string, lastName: string) {
    setMembers((prev) =>
      prev.map((m) => (m.id === memberId ? { ...m, firstName: firstName.trim(), lastName: lastName.trim() } : m))
    )
  }

  function deleteMember(memberId: string) {
    setMembers((prev) => prev.filter((m) => m.id !== memberId))
    setAttendance((prev) => {
      const next = { ...prev }
      delete next[memberId]
      return next
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <CalendarDays className="h-4 w-4" />
            <span className="text-sm">{todayStr}</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">{serviceType}</h1>
          <div className="flex items-center gap-2 text-sm">
            <Badge variant="secondary" className="rounded">
              <Users className="mr-1 h-3.5 w-3.5" />
              {totalPresent} present
            </Badge>
            <span className="text-muted-foreground">/ {totalMembers} total</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={clearAllAttendance}>
            Clear attendance
          </Button>

          {/* Manage Members */}
          <Dialog open={openMembers} onOpenChange={setOpenMembers}>
            <DialogTrigger asChild>
              <Button variant="default">
                <UserPlus className="mr-2 h-4 w-4" />
                Manage members
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Members</DialogTitle>
              </DialogHeader>
              <ManageMembersPanel
                families={families}
                members={members}
                onAddMember={addMember}
                onDeleteMember={deleteMember}
                onReassignFamily={updateMemberFamily}
                onRenameMember={updateMemberName}
              />
            </DialogContent>
          </Dialog>

          {/* Manage Families */}
          <Dialog open={openFamilies} onOpenChange={setOpenFamilies}>
            <DialogTrigger asChild>
              <Button variant="secondary">
                <Settings2 className="mr-2 h-4 w-4" />
                Manage families
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl">
              <DialogHeader>
                <DialogTitle>Families</DialogTitle>
              </DialogHeader>
              <ManageFamiliesPanel
                families={families}
                members={members}
                onAddFamily={addFamily}
                onRenameFamily={renameFamily}
                onDeleteFamily={deleteFamily}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Attendance List */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <CheckCircle2 className="h-4 w-4" />
            Attendance
          </CardTitle>
          <CardDescription>Mark each member present for today’s service.</CardDescription>
        </CardHeader>
        <Separator />
        <CardContent className="p-0">
          <div className="max-h-[70vh] overflow-y-auto">
            <div className="divide-y">
              {grouped.map((bucket) => {
                const presentCount = bucket.members.reduce(
                  (acc, m) => acc + (attendance[m.id] ? 1 : 0),
                  0
                )
                return (
                  <section key={bucket.id} className="p-4">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold">{bucket.name}</h3>
                        <Badge variant="outline" className="rounded">
                          {presentCount} / {bucket.members.length}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => markAllInFamily(bucket.id, true)}
                          disabled={bucket.members.length === 0}
                        >
                          Mark all present
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markAllInFamily(bucket.id, false)}
                          disabled={bucket.members.length === 0}
                        >
                          Clear
                        </Button>
                      </div>
                    </div>
                    {bucket.members.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No members in this family.</p>
                    ) : (
                      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {bucket.members.map((m) => {
                          const checked = !!attendance[m.id]
                          const label = `${m.lastName}, ${m.firstName}`
                          return (
                            <li
                              key={m.id}
                              className="flex items-center justify-between rounded-md border p-3"
                            >
                              <div className="flex min-w-0 items-center gap-3">
                                <Checkbox
                                  id={`att_${m.id}`}
                                  checked={checked}
                                  onCheckedChange={(v) => toggleAttendance(m.id, v)}
                                  aria-label={`Attendance checkbox for ${label}`}
                                />
                                <Label
                                  htmlFor={`att_${m.id}`}
                                  className="truncate"
                                  title={label}
                                >
                                  {label}
                                </Label>
                              </div>
                              {checked ? (
                                <Badge className="ml-2" variant="secondary">
                                  Present
                                </Badge>
                              ) : null}
                            </li>
                          )
                        })}
                      </ul>
                    )}
                  </section>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
