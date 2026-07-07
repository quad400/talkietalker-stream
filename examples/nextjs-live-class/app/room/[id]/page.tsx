"use client"

import { Suspense, useState } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"

import { TalkieTalkerRoom } from "@talkietalker/stream-react"
import { Button } from "@/components/ui/button"

function RoomContent() {
  const params = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const router = useRouter()
  const roomId = params.id
  const name = searchParams.get("name")?.trim()
  const role = searchParams.get("role") === "host" ? "host" : "participant"
  const [error, setError] = useState<string | null>(null)

  if (!roomId) {
    return <p className="p-6 text-muted-foreground">Missing room id.</p>
  }

  if (!name) {
    return (
      <p className="p-6 text-muted-foreground">
        Open a class and click <strong>Join room</strong> so your display name is included.
      </p>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="max-w-md text-destructive">{error}</p>
        <p className="max-w-md text-sm text-muted-foreground">
          Students must enroll before joining. Go back to the class page and click{" "}
          <strong>Join room</strong> (which enrolls you automatically).
        </p>
        <Button variant="outline" onClick={() => router.push("/")}>
          Back to classes
        </Button>
      </div>
    )
  }

  return (
    <TalkieTalkerRoom
      roomId={roomId}
      participant={{ name, role }}
      theme="dark"
      features={{ chat: true, screenShare: true, waitingRoom: true }}
      onLeave={() => router.push("/")}
      onError={(message) => {
        if (message.toLowerCase().includes("unauthorized")) {
          setError("Access denied — enroll on the class page first, then try again.")
          return
        }
        setError(message)
      }}
    />
  )
}

export default function RoomPage() {
  return (
    <Suspense fallback={<p className="p-6 text-muted-foreground">Loading room…</p>}>
      <RoomContent />
    </Suspense>
  )
}
