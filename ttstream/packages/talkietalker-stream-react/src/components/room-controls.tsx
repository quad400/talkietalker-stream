"use client"

import type React from "react"

import type { TalkieTalkerStreamLabels } from "../i18n/labels.js"

export function RoomControls({
  micMuted,
  videoOff,
  isScreenSharing,
  onToggleMic,
  onToggleVideo,
  onToggleScreenShare,
  onLeave,
  screenShareEnabled = true,
  labels,
}: {
  micMuted: boolean
  videoOff: boolean
  isScreenSharing: boolean
  onToggleMic: () => void
  onToggleVideo: () => void
  onToggleScreenShare: () => void
  onLeave: () => void
  screenShareEnabled?: boolean
  labels: TalkieTalkerStreamLabels
}) {
  const btn: React.CSSProperties = {
    border: "1px solid var(--sf-border)",
    background: "var(--sf-surface)",
    color: "var(--sf-text)",
    borderRadius: "var(--sf-radius)",
    padding: "10px 14px",
    cursor: "pointer",
    fontSize: 14,
  }

  const danger: React.CSSProperties = {
    ...btn,
    background: "#dc2626",
    borderColor: "#dc2626",
    color: "#fff",
  }

  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        justifyContent: "center",
        padding: 16,
        flexWrap: "wrap",
      }}
    >
      <button type="button" style={btn} onClick={onToggleMic}>
        {micMuted ? labels.unmuteButton : labels.muteButton}
      </button>
      <button type="button" style={btn} onClick={onToggleVideo}>
        {videoOff ? labels.startVideoButton : labels.stopVideoButton}
      </button>
      {screenShareEnabled ? (
        <button type="button" style={btn} onClick={onToggleScreenShare}>
          {isScreenSharing ? labels.stopShareButton : labels.shareScreenButton}
        </button>
      ) : null}
      <button type="button" style={danger} onClick={onLeave}>
        {labels.leaveButton}
      </button>
    </div>
  )
}
