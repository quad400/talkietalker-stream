"use client"

import { useState } from "react"

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
import { useSetSession, type SessionRole } from "@/hooks/use-api"

type SignInFormProps = {
  defaultRole?: SessionRole
  compact?: boolean
  submitLabel?: string
}

export function SignInForm({
  defaultRole = "student",
  compact = false,
  submitLabel = "Join app",
}: SignInFormProps) {
  const setSession = useSetSession()
  const [name, setName] = useState("")
  const [role, setRole] = useState<SessionRole>(defaultRole)

  if (compact) {
    return (
      <form
        className="flex items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          if (!name.trim()) return
          setSession.mutate({ name: name.trim(), role })
        }}
      >
        <Input
          className="h-8 w-32"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Select value={role} onValueChange={(v) => setRole(v as SessionRole)}>
          <SelectTrigger className="h-8 w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="student">Student</SelectItem>
            <SelectItem value="instructor">Instructor</SelectItem>
          </SelectContent>
        </Select>
        <Button size="sm" type="submit" disabled={setSession.isPending}>
          {submitLabel}
        </Button>
      </form>
    )
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault()
        if (!name.trim()) return
        setSession.mutate({ name: name.trim(), role })
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="signin-name">Your name</Label>
        <Input
          id="signin-name"
          placeholder="Dr. Smith"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="signin-role">Role</Label>
        <Select value={role} onValueChange={(v) => setRole(v as SessionRole)}>
          <SelectTrigger id="signin-role">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="instructor">Instructor</SelectItem>
            <SelectItem value="student">Student</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" disabled={setSession.isPending || !name.trim()}>
        {setSession.isPending ? "Signing in…" : submitLabel}
      </Button>
      {setSession.error ? (
        <p className="text-sm text-destructive">{setSession.error.message}</p>
      ) : null}
    </form>
  )
}
