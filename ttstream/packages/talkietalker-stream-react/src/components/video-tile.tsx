"use client"

import * as React from "react"

import { participantHasDisplayableVideo } from "../signaling/helpers.js"
import type { SignalingParticipant } from "../signaling/types.js"
import { initials } from "./grid-layout.js"

export function VideoTile({
  participant,
  speaking = false,
  className,
}: {
  participant: SignalingParticipant
  speaking?: boolean
  className?: string
}) {
  const ref = React.useRef<HTMLVideoElement>(null)
  const [hasVideo, setHasVideo] = React.useState(() =>
    participantHasDisplayableVideo(participant),
  )

  React.useEffect(() => {
    const update = () => setHasVideo(participantHasDisplayableVideo(participant))
    update()
    const stream = participant.stream
    if (!stream) return
    for (const track of stream.getTracks()) {
      track.addEventListener("mute", update)
      track.addEventListener("unmute", update)
      track.addEventListener("ended", update)
    }
    return () => {
      for (const track of stream.getTracks()) {
        track.removeEventListener("mute", update)
        track.removeEventListener("unmute", update)
        track.removeEventListener("ended", update)
      }
    }
  }, [participant])

  React.useEffect(() => {
    const video = ref.current
    if (!video) return
    video.srcObject = participant.stream ?? null
    if (participant.stream) void video.play().catch(() => undefined)
  }, [participant.stream])

  const mirror =
    hasVideo &&
    !participant.isScreenSharing &&
    (participant.isLocal ||
      participant.stream?.getVideoTracks()[0]?.getSettings().displaySurface === undefined)

  return (
    <div
      className={className}
      style={{
        position: "relative",
        aspectRatio: "16/9",
        borderRadius: "var(--sf-radius)",
        overflow: "hidden",
        background: "var(--sf-surface)",
        border: speaking ? "2px solid var(--sf-primary)" : "1px solid var(--sf-border)",
      }}
    >
      {hasVideo ? (
        <video
          ref={ref}
          autoPlay
          playsInline
          muted={participant.isLocal}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: mirror ? "scaleX(-1)" : undefined,
          }}
        />
      ) : (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            color: "var(--sf-text)",
            fontSize: "1.5rem",
            fontWeight: 600,
          }}
        >
          {initials(participant.username)}
        </div>
      )}
      <div
        style={{
          position: "absolute",
          left: 8,
          bottom: 8,
          padding: "2px 8px",
          borderRadius: 4,
          background: "rgba(0,0,0,0.55)",
          color: "#fff",
          fontSize: 12,
        }}
      >
        {participant.username}
        {participant.audioMuted ? " (muted)" : ""}
        {participant.isScreenSharing ? " · screen" : ""}
      </div>
    </div>
  )
}
