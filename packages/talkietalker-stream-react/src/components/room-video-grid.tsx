"use client"

import type { SignalingParticipant } from "../signaling/types.js"
import {
  getGridColumnClass,
  getGridMaxVisible,
  useParticipantGridBreakpoint,
} from "./grid-layout.js"
import { VideoTile } from "./video-tile.js"

export function RoomVideoGrid({
  participants,
  activeSpeakerId,
}: {
  participants: SignalingParticipant[]
  activeSpeakerId?: string | null
}) {
  const breakpoint = useParticipantGridBreakpoint()
  const maxVisible = getGridMaxVisible(participants.length, breakpoint)
  const visible = participants.slice(0, maxVisible)
  const hidden = participants.length - visible.length
  const gridClass = getGridColumnClass(visible.length + (hidden > 0 ? 1 : 0))

  if (participants.length === 0) {
    return (
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--sf-muted)",
        }}
      >
        Waiting for participants…
      </div>
    )
  }

  return (
    <div
      className={`sf-video-grid ${gridClass}`}
      style={{
        display: "grid",
        gap: 12,
        width: "100%",
        maxWidth: 1200,
        margin: "0 auto",
        padding: 16,
      }}
    >
      {visible.map((participant) => (
        <VideoTile
          key={participant.id}
          participant={participant}
          speaking={activeSpeakerId === participant.id}
        />
      ))}
      {hidden > 0 ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "var(--sf-radius)",
            background: "var(--sf-surface)",
            color: "var(--sf-muted)",
            fontWeight: 600,
          }}
        >
          +{hidden} more
        </div>
      ) : null}
    </div>
  )
}
