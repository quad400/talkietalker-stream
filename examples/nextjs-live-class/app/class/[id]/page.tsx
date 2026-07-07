"use client"

import { useParams, useRouter } from "next/navigation"
import { useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  useChatHistory,
  useClass,
  useEnroll,
  useSession,
  useStartClass,
  useStopClass,
} from "@/hooks/use-api"
import { formatDate } from "@/lib/utils"

export default function ClassDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const id = params.id
  const { data: session } = useSession()
  const { data: liveClass, isLoading } = useClass(
    id,
    session?.role === "student" ? session.name : undefined,
  )
  const startClass = useStartClass(id)
  const stopClass = useStopClass(id)
  const enroll = useEnroll(id)
  const chat = useChatHistory(
    id,
    liveClass?.status === "live" || liveClass?.status === "ended",
  )
  const [studentName, setStudentName] = useState("")
  const [joinError, setJoinError] = useState<string | null>(null)

  if (isLoading || !liveClass) {
    return <p className="text-muted-foreground">Loading class…</p>
  }

  const isHost = session?.name === liveClass.hostName
  const isEnrolled = isHost || liveClass.isEnrolled === true
  const canJoin =
    session &&
    (isHost || session.role === "student") &&
    liveClass.status !== "ended"

  async function handleJoin() {
    if (!session || !liveClass) return
    setJoinError(null)

    try {
      if (!isHost && !liveClass.isEnrolled) {
        await enroll.mutateAsync(session.name)
      }

      router.push(
        `/room/${liveClass.streamId}?name=${encodeURIComponent(session.name)}&role=${isHost ? "host" : "participant"}`,
      )
    } catch (err) {
      setJoinError(err instanceof Error ? err.message : "Could not join class")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">{liveClass.title}</h1>
            <Badge variant={liveClass.status === "live" ? "live" : "secondary"}>
              {liveClass.status}
            </Badge>
          </div>
          <p className="mt-2 text-muted-foreground">
            Host: {liveClass.hostName} · Stream ID:{" "}
            <code className="rounded bg-muted px-1 text-xs">{liveClass.streamId}</code>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {isHost ? (
            <>
              <Button
                variant="secondary"
                disabled={liveClass.status === "live" || startClass.isPending}
                onClick={() => startClass.mutate(session!.name)}
              >
                Start class
              </Button>
              <Button
                variant="destructive"
                disabled={liveClass.status !== "live" || stopClass.isPending}
                onClick={() => stopClass.mutate(session!.name)}
              >
                End class
              </Button>
            </>
          ) : null}
          {canJoin ? (
            <Button onClick={handleJoin} disabled={enroll.isPending}>
              {enroll.isPending ? "Enrolling…" : "Join room"}
            </Button>
          ) : null}
        </div>
      </div>

      {joinError ? <p className="text-sm text-destructive">{joinError}</p> : null}

      {liveClass.description ? (
        <p className="text-muted-foreground">{liveClass.description}</p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Enroll as student</CardTitle>
            <CardDescription>
              Enrollment is required before joining. Click <strong>Join room</strong> to enroll
              automatically, or enroll manually below.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault()
                const name = studentName.trim() || session?.name
                if (!name) return
                enroll.mutate(name, { onSuccess: () => setStudentName("") })
              }}
            >
              <div className="flex-1 space-y-2">
                <Label htmlFor="student">Display name</Label>
                <Input
                  id="student"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder={session?.name ?? "Alex"}
                />
              </div>
              <Button className="self-end" type="submit" disabled={enroll.isPending}>
                Enroll
              </Button>
            </form>
            {enroll.error ? (
              <p className="mt-2 text-sm text-destructive">{enroll.error.message}</p>
            ) : null}
            <p className="mt-3 text-sm text-muted-foreground">
              {liveClass.enrollmentCount} student(s) enrolled
              {session?.role === "student" && isEnrolled ? " · You are enrolled" : ""}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Stream metadata</CardTitle>
            <CardDescription>From <code>streams.retrieve</code></CardDescription>
          </CardHeader>
          <CardContent className="space-y-1 text-sm text-muted-foreground">
            <p>Viewers: {liveClass.stream?.viewer_count ?? "—"}</p>
            <p>Started: {formatDate(liveClass.stream?.started_at ?? undefined)}</p>
            <p>Ended: {formatDate(liveClass.stream?.ended_at ?? undefined)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Chat history</CardTitle>
          <CardDescription>
            Server-side <code>chat.listHistory</code> for this stream
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {chat.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading chat…</p>
          ) : chat.data?.available === false ? (
            <p className="text-sm text-muted-foreground">
              {chat.data.message ??
                "Chat history API is not available in this environment. Use in-room chat while the session is live."}
            </p>
          ) : chat.data?.messages.length ? (
            chat.data.messages.map((msg) => (
              <div key={msg.id} className="rounded border px-3 py-2 text-sm">
                <span className="font-medium">{msg.username ?? "Guest"}</span>
                <span className="text-muted-foreground"> · {msg.content}</span>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No messages yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
