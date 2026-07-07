"use client"

import * as React from "react"

import { getTalkieTalkerStreamConfig, setTalkieTalkerStreamConfig, themeToCssVars } from "../core/config.js"
import { postEmbedEvent } from "../embed-bridge.js"
import { useBroadcastViewer } from "../signaling/use-broadcast-viewer.js"

export type PaymentRequiredInfo = {
  streamId: string
  message?: string
}

export type TalkieTalkerPlayerProps = {
  streamId: string
  token?: string
  wsUrl?: string
  theme?: "dark" | "light"
  className?: string
  onPaymentRequired?: (info: PaymentRequiredInfo) => void
}

export function TalkieTalkerPlayer({
  streamId,
  token,
  wsUrl,
  theme = "dark",
  className,
  onPaymentRequired,
}: TalkieTalkerPlayerProps) {
  const providerConfig = getTalkieTalkerStreamConfig()
  const cssVars = React.useMemo(
    () => themeToCssVars(providerConfig.theme, theme),
    [providerConfig.theme, theme],
  )

  React.useEffect(() => {
    if (wsUrl) setTalkieTalkerStreamConfig({ wsUrl })
  }, [wsUrl])
  const videoRef = React.useRef<HTMLVideoElement>(null)
  const viewer = useBroadcastViewer(streamId, true, { token })

  React.useEffect(() => {
    const video = videoRef.current
    if (!video) return
    video.srcObject = viewer.remoteStream
    if (viewer.remoteStream) void video.play().catch(() => undefined)
  }, [viewer.remoteStream])

  React.useEffect(() => {
    if (viewer.connected) {
      postEmbedEvent({ type: "talkietalker-stream:joined", payload: { streamId } })
    }
  }, [viewer.connected, streamId])

  React.useEffect(() => {
    if (!viewer.error) return
    if (viewer.error.toLowerCase().includes("payment")) {
      onPaymentRequired?.({ streamId, message: viewer.error })
    }
    postEmbedEvent({
      type: "talkietalker-stream:error",
      payload: { message: viewer.error },
    })
  }, [viewer.error, streamId, onPaymentRequired])

  return (
    <div
      className={className}
      style={{
        ...(cssVars as React.CSSProperties),
        background: "var(--sf-bg)",
        color: "var(--sf-text)",
        minHeight: 200,
        position: "relative",
      }}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        controls
        style={{ width: "100%", aspectRatio: "16/9", background: "#000" }}
      />
      {viewer.connecting ? (
        <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>
          Connecting…
        </div>
      ) : null}
      {viewer.error ? (
        <div style={{ padding: 12, color: "#f87171" }}>{viewer.error}</div>
      ) : null}
    </div>
  )
}
