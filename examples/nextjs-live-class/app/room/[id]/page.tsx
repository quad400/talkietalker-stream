"use client"

import { useParams, useRouter } from "next/navigation"
import { StreamFlowRoom } from "@streamflow/react"

export default function RoomPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const roomId = params.id

  if (!roomId || roomId === "demo") {
    return (
      <p style={{ padding: 24 }}>
        Create a room with <code>npm run create-room</code>, then open the printed URL.
      </p>
    )
  }

  return (
    <StreamFlowRoom
      roomId={roomId}
      participant={{ name: "Student" }}
      theme="dark"
      onLeave={() => router.push("/")}
    />
  )
}
