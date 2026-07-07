"use client"

import { useState } from "react"

import { SignInForm } from "@/components/sign-in-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useCreateClass, useSession } from "@/hooks/use-api"

export function CreateClassForm() {
  const { data: session, isLoading } = useSession()
  const createClass = useCreateClass()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading…</p>
  }

  if (!session || session.role !== "instructor") {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Sign in as an <strong>instructor</strong> to create a live class. You can also use the
          sign-in form in the top-right header.
        </p>
        <SignInForm defaultRole="instructor" submitLabel="Sign in as instructor" />
      </div>
    )
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault()
        createClass.mutate(
          { title, description, hostName: session.name },
          {
            onSuccess: () => {
              setTitle("")
              setDescription("")
            },
          },
        )
      }}
    >
      <p className="text-sm text-muted-foreground">
        Signed in as <strong>{session.name}</strong> (host)
      </p>
      <div className="space-y-2">
        <Label htmlFor="title">Class title</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Intro to WebRTC"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What students will learn..."
        />
      </div>
      <Button type="submit" disabled={createClass.isPending || !title.trim()}>
        {createClass.isPending ? "Creating…" : "Create class"}
      </Button>
      {createClass.error ? (
        <p className="text-sm text-destructive">{createClass.error.message}</p>
      ) : null}
    </form>
  )
}
