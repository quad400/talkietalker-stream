"use client"

import * as React from "react"

import { RoomControls } from "../components/room-controls.js"
import { RoomVideoGrid } from "../components/room-video-grid.js"
import { VideoTile } from "../components/video-tile.js"
import {
  applyCustomCss,
  setTalkieTalkerStreamConfig,
  themeToCssVars,
} from "../core/config.js"
import {
  brandingToTheme,
  embedFeaturesToRoomFeatures,
  parseEmbedClaims,
} from "../core/embed-token.js"
import type { Participant } from "../client/talkietalker-stream-client.js"
import { useTalkieTalkerStreamClient } from "../components/talkietalker-stream.js"
import { postEmbedEvent } from "../embed-bridge.js"
import { resolveLabels, type TalkieTalkerStreamLabels } from "../i18n/labels.js"
import { isMeetingErrorBlocking } from "../signaling/helpers.js"
import type { ProjectFeaturesPayload } from "../signaling/types.js"
import { useRoomSession } from "../signaling/use-room-session.js"
import type { SignalingParticipant } from "../signaling/types.js"

export type TalkieTalkerRoomFeatures = {
  chat?: boolean
  screenShare?: boolean
  waitingRoom?: boolean
}

export type TalkieTalkerRoomProps = {
  roomId: string
  participant: Participant
  hostUserId?: string
  theme?: "dark" | "light"
  features?: TalkieTalkerRoomFeatures
  labels?: Partial<TalkieTalkerStreamLabels>
  locale?: string
  showBranding?: boolean
  logoUrl?: string
  customCssUrl?: string
  prejoin?: boolean
  headless?: boolean
  onLeave?: () => void
  onJoined?: (participantId: string | null) => void
  onError?: (message: string) => void
  renderParticipant?: (participant: SignalingParticipant) => React.ReactNode
  className?: string
}

function mergeRoomFeatures(
  propsFeatures: TalkieTalkerRoomFeatures,
  project?: ProjectFeaturesPayload | null,
  tokenFeatures?: ReturnType<typeof embedFeaturesToRoomFeatures>,
): TalkieTalkerRoomFeatures {
  const screenShare =
    (project?.screen_share ?? tokenFeatures?.screenShare ?? true) &&
    (propsFeatures.screenShare !== false)
  const chat =
    (project?.chat ?? tokenFeatures?.chat ?? true) &&
    (propsFeatures.chat !== false)
  const waitingRoom =
    (project?.waiting_room ?? tokenFeatures?.waitingRoom ?? true) &&
    (propsFeatures.waitingRoom !== false)
  return { screenShare, chat, waitingRoom }
}

export function TalkieTalkerRoom({
  roomId,
  participant,
  hostUserId,
  theme = "dark",
  features: featuresProp = {},
  labels: labelOverrides,
  locale: localeProp,
  showBranding: showBrandingProp,
  logoUrl: logoUrlProp,
  customCssUrl: customCssUrlProp,
  prejoin = true,
  headless = false,
  onLeave,
  onJoined,
  onError,
  renderParticipant,
  className,
}: TalkieTalkerRoomProps) {
  const client = useTalkieTalkerStreamClient()
  const [connection, setConnection] = React.useState<{
    token: string
    wsUrl: string
  } | null>(null)
  const [connectionError, setConnectionError] = React.useState<string | null>(null)

  const embedClaims = React.useMemo(
    () => (connection ? parseEmbedClaims(connection.token) : {}),
    [connection],
  )
  const brandingTheme = React.useMemo(
    () => brandingToTheme(embedClaims.branding),
    [embedClaims.branding],
  )
  const mergedTheme = React.useMemo(() => ({ ...brandingTheme }), [brandingTheme])
  const logoUrl = logoUrlProp ?? mergedTheme.logoUrl
  const customCssUrl = customCssUrlProp ?? embedClaims.branding?.custom_css_url
  const showBranding = showBrandingProp ?? mergedTheme.showBranding ?? true
  const locale = localeProp ?? "en"
  const labels = React.useMemo(
    () => resolveLabels(locale, labelOverrides),
    [locale, labelOverrides],
  )

  const cssVars = React.useMemo(
    () => themeToCssVars(mergedTheme, theme),
    [mergedTheme, theme],
  )

  const [prejoinComplete, setPrejoinComplete] = React.useState(!prejoin)
  const [localParticipant, setLocalParticipant] = React.useState(participant)

  React.useEffect(() => {
    setLocalParticipant(participant)
  }, [participant])

  React.useEffect(() => {
    if (!prejoinComplete) return
    let cancelled = false
    setConnectionError(null)
    void client
      .getConnection(roomId, {
        ...localParticipant,
        name: localParticipant.name.trim() || participant.name,
      })
      .then((info) => {
        if (!cancelled) {
          setConnection(info)
          setTalkieTalkerStreamConfig({ wsUrl: info.wsUrl })
        }
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setConnectionError(err.message)
          onError?.(err.message)
        }
      })
    return () => {
      cancelled = true
    }
  }, [client, roomId, localParticipant, prejoinComplete, participant.name, onError])

  React.useEffect(() => {
    if (!customCssUrl) return
    return applyCustomCss(customCssUrl)
  }, [customCssUrl])

  const sessionEnabled = prejoinComplete && Boolean(connection?.token)
  const session = useRoomSession(roomId, sessionEnabled, hostUserId, {
    token: connection?.token,
    wsUrl: connection?.wsUrl,
    displayName: localParticipant.name,
    joinWithoutMedia: false,
  })

  const resolvedFeatures = React.useMemo(
    () =>
      mergeRoomFeatures(
        featuresProp,
        session.projectFeatures,
        embedFeaturesToRoomFeatures(embedClaims.features),
      ),
    [featuresProp, session.projectFeatures, embedClaims.features],
  )

  const activeSpeakerId = session.participants.find((p) => p.handRaised)?.id ?? null

  React.useEffect(() => {
    if (session.connected) {
      onJoined?.(session.participants.find((p) => p.isLocal)?.id ?? null)
      postEmbedEvent({
        type: "talkietalker-stream:joined",
        payload: { roomId, participantId: session.participants.find((p) => p.isLocal)?.id },
      })
    }
  }, [session.connected, roomId, session.participants, onJoined])

  React.useEffect(() => {
    if (session.error) {
      const msg = session.error.description || session.error.title
      onError?.(msg)
      postEmbedEvent({
        type: "talkietalker-stream:error",
        payload: { code: session.error.kind, message: msg },
      })
    }
  }, [session.error, onError])

  const handleLeave = React.useCallback(() => {
    session.leave()
    postEmbedEvent({ type: "talkietalker-stream:left", payload: { reason: "user" } })
    onLeave?.()
  }, [session, onLeave])

  const waitingRoomBlocking =
    session.error?.code === "waiting_room_not_admitted" &&
    isMeetingErrorBlocking(session.error, session.connected)

  if (!prejoinComplete) {
    return (
      <div
        className={className}
        style={{
          ...(cssVars as React.CSSProperties),
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100%",
          background: "var(--sf-bg)",
          color: "var(--sf-text)",
          fontFamily: "var(--sf-font)",
          padding: 24,
          gap: 16,
        }}
      >
        {logoUrl ? (
          <img
            src={logoUrl}
            alt=""
            style={{ maxHeight: 48, maxWidth: 200, objectFit: "contain" }}
          />
        ) : null}
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>{labels.prejoinTitle}</h2>
        <input
          type="text"
          value={localParticipant.name}
          onChange={(e) =>
            setLocalParticipant((prev) => ({ ...prev, name: e.target.value }))
          }
          placeholder={labels.displayNamePlaceholder}
          style={{
            width: "100%",
            maxWidth: 320,
            padding: "10px 12px",
            borderRadius: "var(--sf-radius)",
            border: "1px solid var(--sf-border)",
            background: "var(--sf-surface)",
            color: "var(--sf-text)",
            fontSize: 14,
          }}
        />
        <button
          type="button"
          onClick={() => setPrejoinComplete(true)}
          disabled={!localParticipant.name.trim()}
          style={{
            padding: "10px 20px",
            borderRadius: "var(--sf-radius)",
            border: "none",
            background: "var(--sf-primary)",
            color: "#fff",
            fontSize: 14,
            cursor: localParticipant.name.trim() ? "pointer" : "not-allowed",
            opacity: localParticipant.name.trim() ? 1 : 0.6,
          }}
        >
          {labels.joinButton}
        </button>
        {showBranding !== false ? (
          <footer style={{ marginTop: "auto", fontSize: 12, color: "var(--sf-muted)" }}>
            {labels.poweredBy}
          </footer>
        ) : null}
      </div>
    )
  }

  if (headless && renderParticipant) {
    return (
      <div className={className} style={cssVars as React.CSSProperties}>
        {session.participants.map((p) => (
          <React.Fragment key={p.id}>{renderParticipant(p)}</React.Fragment>
        ))}
      </div>
    )
  }

  if (connectionError && prejoinComplete) {
    return (
      <div className={className} style={{ padding: 24, color: "#f87171" }}>
        {connectionError}
      </div>
    )
  }

  if (!connection && prejoinComplete) {
    return (
      <div className={className} style={{ padding: 24 }}>
        {labels.connecting}
      </div>
    )
  }

  return (
    <div
      className={className}
      style={{
        ...(cssVars as React.CSSProperties),
        display: "flex",
        flexDirection: "column",
        minHeight: "100%",
        background: "var(--sf-bg)",
        color: "var(--sf-text)",
        fontFamily: "var(--sf-font)",
        position: "relative",
      }}
      data-ws-url={connection?.wsUrl}
    >
      {logoUrl ? (
        <header style={{ padding: "12px 16px", borderBottom: "1px solid var(--sf-border)" }}>
          <img
            src={logoUrl}
            alt=""
            style={{ maxHeight: 32, maxWidth: 160, objectFit: "contain" }}
          />
        </header>
      ) : null}
      {session.error && isMeetingErrorBlocking(session.error, session.connected) ? (
        <div style={{ padding: 24, color: "#f87171" }}>
          {waitingRoomBlocking ? labels.waitingRoomTitle : null}
          {!waitingRoomBlocking ? (
            <>
              {session.error.title}: {session.error.description}
            </>
          ) : null}
        </div>
      ) : (
        <>
          <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
            {renderParticipant ? (
              <div style={{ display: "grid", gap: 12, padding: 16, width: "100%" }}>
                {session.participants.map((p) => (
                  <React.Fragment key={p.id}>{renderParticipant(p)}</React.Fragment>
                ))}
              </div>
            ) : (
              <RoomVideoGrid
                participants={session.participants}
                activeSpeakerId={activeSpeakerId}
              />
            )}
          </div>
          <RoomControls
            micMuted={session.micMuted}
            videoOff={session.videoOff}
            isScreenSharing={session.isScreenSharing}
            onToggleMic={session.toggleMic}
            onToggleVideo={session.toggleVideo}
            onToggleScreenShare={session.toggleScreenShare}
            onLeave={handleLeave}
            screenShareEnabled={resolvedFeatures.screenShare !== false}
            labels={labels}
          />
          {showBranding !== false ? (
            <footer
              style={{
                textAlign: "center",
                padding: "8px 16px",
                fontSize: 12,
                color: "var(--sf-muted)",
                borderTop: "1px solid var(--sf-border)",
              }}
            >
              {labels.poweredBy}
            </footer>
          ) : null}
        </>
      )}
      {session.connecting ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "grid",
            placeItems: "center",
            background: "color-mix(in srgb, var(--sf-bg) 80%, transparent)",
          }}
        >
          {labels.connecting}
        </div>
      ) : null}
    </div>
  )
}

export { VideoTile, RoomVideoGrid, RoomControls }
