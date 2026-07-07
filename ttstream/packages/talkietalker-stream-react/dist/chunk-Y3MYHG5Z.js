import {
  useRoomSession
} from "./chunk-3POXSNJG.js";
import {
  DEFAULT_TOKEN_PATH,
  applyCustomCss,
  isMeetingErrorBlocking,
  participantHasDisplayableVideo,
  readPublishKeyFromEnv,
  resolveWsUrlFromPublishKey,
  setTalkieTalkerStreamConfig,
  themeToCssVars
} from "./chunk-7OFM7NYG.js";

// src/core/embed-token.ts
function parseEmbedClaims(token) {
  const parts = token.split(".");
  if (parts.length < 2) return {};
  try {
    const json = decodeBase64Url(parts[1]);
    const payload = JSON.parse(json);
    return {
      branding: payload.branding,
      features: payload.features
    };
  } catch {
    return {};
  }
}
function decodeBase64Url(input) {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/");
  const pad = padded.length % 4 === 0 ? "" : "=".repeat(4 - padded.length % 4);
  if (typeof atob === "function") {
    return atob(padded + pad);
  }
  return Buffer.from(padded + pad, "base64").toString("utf8");
}
function parseEmbedExpiryMs(token) {
  const parts = token.split(".");
  if (parts.length < 2) return null;
  try {
    const json = decodeBase64Url(parts[1]);
    const payload = JSON.parse(json);
    return payload.exp ? payload.exp * 1e3 : null;
  } catch {
    return null;
  }
}
function brandingToTheme(branding) {
  if (!branding) return void 0;
  return {
    primaryColor: branding.primary_color,
    backgroundColor: branding.background_color,
    fontFamily: branding.font_family,
    logoUrl: branding.logo_url,
    showBranding: branding.show_talkietalker_stream_badge ?? true,
    appName: branding.app_name
  };
}
function embedFeaturesToRoomFeatures(features) {
  if (!features) return void 0;
  return {
    chat: features.chat,
    screenShare: features.screen_share,
    waitingRoom: features.waiting_room
  };
}

// src/client/talkietalker-stream-client.ts
var ConfigurationError = class extends Error {
  constructor(message) {
    super(message);
    this.name = "ConfigurationError";
  }
};
function cacheKey(roomId, participant) {
  return `${roomId}:${participant.userId ?? participant.name}`;
}
function defaultFetch(input, init) {
  return fetch(input, init);
}
function deriveWsFromWindow() {
  if (typeof window !== "undefined") {
    return window.location.origin.replace(/^http/i, "ws");
  }
  return "ws://localhost:8080";
}
var TalkieTalkerStreamClient = class _TalkieTalkerStreamClient {
  publishKey;
  tokenPath;
  fetchImpl;
  cache = /* @__PURE__ */ new Map();
  initialToken;
  initialWsUrl;
  static instance = null;
  constructor(options = {}) {
    const publishKey = options.publishKey ?? readPublishKeyFromEnv();
    if (!publishKey && !options.initialToken) {
      throw new ConfigurationError(
        "Missing publish key. Set NEXT_PUBLIC_TALKIETALKER_STREAM_PUBLISH_KEY or VITE_TALKIETALKER_STREAM_PUBLISH_KEY."
      );
    }
    this.publishKey = publishKey ?? "";
    this.tokenPath = options.tokenPath ?? DEFAULT_TOKEN_PATH;
    this.fetchImpl = options.fetchImpl ?? defaultFetch;
    this.initialToken = options.initialToken;
    this.initialWsUrl = options.initialWsUrl;
  }
  static create(options) {
    if (!options || Object.keys(options).length === 0) {
      if (!_TalkieTalkerStreamClient.instance) {
        _TalkieTalkerStreamClient.instance = new _TalkieTalkerStreamClient();
      }
      return _TalkieTalkerStreamClient.instance;
    }
    return new _TalkieTalkerStreamClient(options);
  }
  getPublishKey() {
    return this.publishKey;
  }
  invalidate(roomId, participant) {
    if (roomId && participant) {
      this.cache.delete(cacheKey(roomId, participant));
      return;
    }
    this.cache.clear();
  }
  async getConnection(roomId, participant) {
    const key = cacheKey(roomId, participant);
    const cached = this.cache.get(key);
    const refreshBufferMs = 6e4;
    if (cached && cached.expiresAtMs - Date.now() > refreshBufferMs) {
      return { token: cached.token, wsUrl: cached.wsUrl, expiresAt: cached.expiresAt };
    }
    if (this.initialToken && !cached) {
      const expiresAtMs2 = parseEmbedExpiryMs(this.initialToken) ?? Date.now() + 36e5;
      const entry2 = {
        token: this.initialToken,
        wsUrl: this.initialWsUrl ?? (this.publishKey ? resolveWsUrlFromPublishKey(this.publishKey) : deriveWsFromWindow()),
        expiresAt: new Date(expiresAtMs2).toISOString(),
        expiresAtMs: expiresAtMs2
      };
      this.cache.set(key, entry2);
      this.initialToken = void 0;
      return { token: entry2.token, wsUrl: entry2.wsUrl, expiresAt: entry2.expiresAt };
    }
    if (!this.publishKey) {
      throw new ConfigurationError(
        "Missing publish key. Cannot mint embed tokens without NEXT_PUBLIC_TALKIETALKER_STREAM_PUBLISH_KEY."
      );
    }
    const res = await this.fetchImpl(this.tokenPath, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-TalkieTalker-Stream-Publish-Key": this.publishKey
      },
      body: JSON.stringify({ roomId, participant })
    });
    const json = await res.json();
    if (!res.ok || !json.token || !json.wsUrl) {
      throw new Error(json.error ?? "Failed to fetch embed token");
    }
    const expiresAtMs = parseEmbedExpiryMs(json.token) ?? (json.expiresAt ? Date.parse(json.expiresAt) : Date.now() + 36e5);
    const entry = {
      token: json.token,
      wsUrl: json.wsUrl,
      expiresAt: json.expiresAt ?? new Date(expiresAtMs).toISOString(),
      expiresAtMs
    };
    this.cache.set(key, entry);
    return { token: entry.token, wsUrl: entry.wsUrl, expiresAt: entry.expiresAt };
  }
};

// src/i18n/defaultLabels.en.ts
var defaultLabelsEn = {
  joinButton: "Join",
  waitingRoomTitle: "Waiting for the host to admit you",
  muteButton: "Mute",
  unmuteButton: "Unmute",
  startVideoButton: "Start video",
  stopVideoButton: "Stop video",
  shareScreenButton: "Share screen",
  stopShareButton: "Stop share",
  leaveButton: "Leave",
  connecting: "Connecting\u2026",
  poweredBy: "Powered by TalkieTalkerStream",
  displayNamePlaceholder: "Your name",
  prejoinTitle: "Join meeting"
};

// src/i18n/labels.ts
var localeDefaults = {
  en: defaultLabelsEn
};
function resolveLabels(locale = "en", overrides) {
  const base = localeDefaults[locale] ?? defaultLabelsEn;
  if (!overrides) return base;
  return { ...base, ...overrides };
}

// src/components/talkietalker-stream.tsx
import * as React from "react";
import { jsx } from "react/jsx-runtime";
var TalkieTalkerStreamClientContext = React.createContext(null);
function TalkieTalkerStream({
  children,
  client,
  clientOptions,
  getAccessToken,
  wsUrl,
  theme,
  locale = "en",
  labels: labelOverrides,
  customCssUrl
}) {
  const resolvedClient = React.useMemo(() => {
    if (client) return client;
    if (clientOptions) return TalkieTalkerStreamClient.create(clientOptions);
    try {
      return TalkieTalkerStreamClient.create();
    } catch {
      return null;
    }
  }, [client, clientOptions]);
  React.useEffect(() => {
    const resolved = resolveLabels(locale, labelOverrides);
    setTalkieTalkerStreamConfig({ getAccessToken, wsUrl, theme, locale, labels: resolved, customCssUrl });
    return () => setTalkieTalkerStreamConfig({});
  }, [getAccessToken, wsUrl, theme, locale, labelOverrides, customCssUrl]);
  const labels = React.useMemo(
    () => resolveLabels(locale, labelOverrides),
    [locale, labelOverrides]
  );
  const cssVars = React.useMemo(() => themeToCssVars(theme), [theme]);
  React.useEffect(() => {
    if (!customCssUrl) return;
    return applyCustomCss(customCssUrl);
  }, [customCssUrl]);
  return /* @__PURE__ */ jsx(TalkieTalkerStreamClientContext.Provider, { value: resolvedClient, children: /* @__PURE__ */ jsx(
    "div",
    {
      className: "talkietalker-stream-root",
      lang: locale,
      style: {
        ...cssVars,
        fontFamily: "var(--sf-font)"
      },
      "data-talkietalker-stream-labels": JSON.stringify(labels),
      children
    }
  ) });
}
function useTalkieTalkerStreamClient() {
  const client = React.useContext(TalkieTalkerStreamClientContext);
  if (!client) {
    throw new Error(
      "useTalkieTalkerStreamClient requires a publish key. Set NEXT_PUBLIC_TALKIETALKER_STREAM_PUBLISH_KEY or pass clientOptions.publishKey."
    );
  }
  return client;
}
var TalkieTalkerStreamProvider = TalkieTalkerStream;

// src/components/room-controls.tsx
import { jsx as jsx2, jsxs } from "react/jsx-runtime";
function RoomControls({
  micMuted,
  videoOff,
  isScreenSharing,
  onToggleMic,
  onToggleVideo,
  onToggleScreenShare,
  onLeave,
  screenShareEnabled = true,
  labels
}) {
  const btn = {
    border: "1px solid var(--sf-border)",
    background: "var(--sf-surface)",
    color: "var(--sf-text)",
    borderRadius: "var(--sf-radius)",
    padding: "10px 14px",
    cursor: "pointer",
    fontSize: 14
  };
  const danger = {
    ...btn,
    background: "#dc2626",
    borderColor: "#dc2626",
    color: "#fff"
  };
  return /* @__PURE__ */ jsxs(
    "div",
    {
      style: {
        display: "flex",
        gap: 8,
        justifyContent: "center",
        padding: 16,
        flexWrap: "wrap"
      },
      children: [
        /* @__PURE__ */ jsx2("button", { type: "button", style: btn, onClick: onToggleMic, children: micMuted ? labels.unmuteButton : labels.muteButton }),
        /* @__PURE__ */ jsx2("button", { type: "button", style: btn, onClick: onToggleVideo, children: videoOff ? labels.startVideoButton : labels.stopVideoButton }),
        screenShareEnabled ? /* @__PURE__ */ jsx2("button", { type: "button", style: btn, onClick: onToggleScreenShare, children: isScreenSharing ? labels.stopShareButton : labels.shareScreenButton }) : null,
        /* @__PURE__ */ jsx2("button", { type: "button", style: danger, onClick: onLeave, children: labels.leaveButton })
      ]
    }
  );
}

// src/components/video-tile.tsx
import * as React2 from "react";

// src/components/grid-layout.ts
import { useEffect as useEffect2, useState } from "react";
function getGridMaxVisible(total, breakpoint) {
  if (total <= 0) return 0;
  if (breakpoint === "xl") return total > 9 ? 9 : total;
  if (breakpoint === "md") return total >= 5 ? 3 : Math.min(total, 4);
  return Math.min(total, 4);
}
function getGridColumnClass(visibleCount) {
  if (visibleCount <= 1) return "sf-grid-cols-1";
  if (visibleCount === 2) return "sf-grid-cols-2";
  if (visibleCount <= 4) return "sf-grid-cols-2";
  return "sf-grid-cols-3";
}
function useParticipantGridBreakpoint() {
  const [breakpoint, setBreakpoint] = useState("sm");
  useEffect2(() => {
    const xl = window.matchMedia("(min-width: 1280px)");
    const md = window.matchMedia("(min-width: 768px)");
    function sync() {
      if (xl.matches) setBreakpoint("xl");
      else if (md.matches) setBreakpoint("md");
      else setBreakpoint("sm");
    }
    sync();
    xl.addEventListener("change", sync);
    md.addEventListener("change", sync);
    return () => {
      xl.removeEventListener("change", sync);
      md.removeEventListener("change", sync);
    };
  }, []);
  return breakpoint;
}
function initials(name) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

// src/components/video-tile.tsx
import { jsx as jsx3, jsxs as jsxs2 } from "react/jsx-runtime";
function VideoTile({
  participant,
  speaking = false,
  className
}) {
  const ref = React2.useRef(null);
  const [hasVideo, setHasVideo] = React2.useState(
    () => participantHasDisplayableVideo(participant)
  );
  React2.useEffect(() => {
    const update = () => setHasVideo(participantHasDisplayableVideo(participant));
    update();
    const stream = participant.stream;
    if (!stream) return;
    for (const track of stream.getTracks()) {
      track.addEventListener("mute", update);
      track.addEventListener("unmute", update);
      track.addEventListener("ended", update);
    }
    return () => {
      for (const track of stream.getTracks()) {
        track.removeEventListener("mute", update);
        track.removeEventListener("unmute", update);
        track.removeEventListener("ended", update);
      }
    };
  }, [participant]);
  React2.useEffect(() => {
    const video = ref.current;
    if (!video) return;
    video.srcObject = participant.stream ?? null;
    if (participant.stream) void video.play().catch(() => void 0);
  }, [participant.stream]);
  const mirror = hasVideo && !participant.isScreenSharing && (participant.isLocal || participant.stream?.getVideoTracks()[0]?.getSettings().displaySurface === void 0);
  return /* @__PURE__ */ jsxs2(
    "div",
    {
      className,
      style: {
        position: "relative",
        aspectRatio: "16/9",
        borderRadius: "var(--sf-radius)",
        overflow: "hidden",
        background: "var(--sf-surface)",
        border: speaking ? "2px solid var(--sf-primary)" : "1px solid var(--sf-border)"
      },
      children: [
        hasVideo ? /* @__PURE__ */ jsx3(
          "video",
          {
            ref,
            autoPlay: true,
            playsInline: true,
            muted: participant.isLocal,
            style: {
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transform: mirror ? "scaleX(-1)" : void 0
            }
          }
        ) : /* @__PURE__ */ jsx3(
          "div",
          {
            style: {
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              color: "var(--sf-text)",
              fontSize: "1.5rem",
              fontWeight: 600
            },
            children: initials(participant.username)
          }
        ),
        /* @__PURE__ */ jsxs2(
          "div",
          {
            style: {
              position: "absolute",
              left: 8,
              bottom: 8,
              padding: "2px 8px",
              borderRadius: 4,
              background: "rgba(0,0,0,0.55)",
              color: "#fff",
              fontSize: 12
            },
            children: [
              participant.username,
              participant.audioMuted ? " (muted)" : "",
              participant.isScreenSharing ? " \xB7 screen" : ""
            ]
          }
        )
      ]
    }
  );
}

// src/components/room-video-grid.tsx
import { jsx as jsx4, jsxs as jsxs3 } from "react/jsx-runtime";
function RoomVideoGrid({
  participants,
  activeSpeakerId
}) {
  const breakpoint = useParticipantGridBreakpoint();
  const maxVisible = getGridMaxVisible(participants.length, breakpoint);
  const visible = participants.slice(0, maxVisible);
  const hidden = participants.length - visible.length;
  const gridClass = getGridColumnClass(visible.length + (hidden > 0 ? 1 : 0));
  if (participants.length === 0) {
    return /* @__PURE__ */ jsx4(
      "div",
      {
        style: {
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--sf-muted)"
        },
        children: "Waiting for participants\u2026"
      }
    );
  }
  return /* @__PURE__ */ jsxs3(
    "div",
    {
      className: `sf-video-grid ${gridClass}`,
      style: {
        display: "grid",
        gap: 12,
        width: "100%",
        maxWidth: 1200,
        margin: "0 auto",
        padding: 16
      },
      children: [
        visible.map((participant) => /* @__PURE__ */ jsx4(
          VideoTile,
          {
            participant,
            speaking: activeSpeakerId === participant.id
          },
          participant.id
        )),
        hidden > 0 ? /* @__PURE__ */ jsxs3(
          "div",
          {
            style: {
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "var(--sf-radius)",
              background: "var(--sf-surface)",
              color: "var(--sf-muted)",
              fontWeight: 600
            },
            children: [
              "+",
              hidden,
              " more"
            ]
          }
        ) : null
      ]
    }
  );
}

// src/embed-bridge.ts
function postEmbedEvent(event, targetOrigin = "*") {
  if (typeof window === "undefined" || window.parent === window) return;
  window.parent.postMessage(event, targetOrigin);
}
function isEmbedBridgeEvent(data) {
  if (!data || typeof data !== "object") return false;
  const type = data.type;
  return type === "talkietalker-stream:joined" || type === "talkietalker-stream:left" || type === "talkietalker-stream:error";
}

// src/room/talkietalker-room.tsx
import * as React3 from "react";
import { Fragment as Fragment2, jsx as jsx5, jsxs as jsxs4 } from "react/jsx-runtime";
function mergeRoomFeatures(propsFeatures, project, tokenFeatures) {
  const screenShare = (project?.screen_share ?? tokenFeatures?.screenShare ?? true) && propsFeatures.screenShare !== false;
  const chat = (project?.chat ?? tokenFeatures?.chat ?? true) && propsFeatures.chat !== false;
  const waitingRoom = (project?.waiting_room ?? tokenFeatures?.waitingRoom ?? true) && propsFeatures.waitingRoom !== false;
  return { screenShare, chat, waitingRoom };
}
function TalkieTalkerRoom({
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
  className
}) {
  const client = useTalkieTalkerStreamClient();
  const [connection, setConnection] = React3.useState(null);
  const [connectionError, setConnectionError] = React3.useState(null);
  const embedClaims = React3.useMemo(
    () => connection ? parseEmbedClaims(connection.token) : {},
    [connection]
  );
  const brandingTheme = React3.useMemo(
    () => brandingToTheme(embedClaims.branding),
    [embedClaims.branding]
  );
  const mergedTheme = React3.useMemo(() => ({ ...brandingTheme }), [brandingTheme]);
  const logoUrl = logoUrlProp ?? mergedTheme.logoUrl;
  const customCssUrl = customCssUrlProp ?? embedClaims.branding?.custom_css_url;
  const showBranding = showBrandingProp ?? mergedTheme.showBranding ?? true;
  const locale = localeProp ?? "en";
  const labels = React3.useMemo(
    () => resolveLabels(locale, labelOverrides),
    [locale, labelOverrides]
  );
  const cssVars = React3.useMemo(
    () => themeToCssVars(mergedTheme, theme),
    [mergedTheme, theme]
  );
  const [prejoinComplete, setPrejoinComplete] = React3.useState(!prejoin);
  const [localParticipant, setLocalParticipant] = React3.useState(participant);
  React3.useEffect(() => {
    setLocalParticipant(participant);
  }, [participant]);
  React3.useEffect(() => {
    if (!prejoinComplete) return;
    let cancelled = false;
    setConnectionError(null);
    void client.getConnection(roomId, {
      ...localParticipant,
      name: localParticipant.name.trim() || participant.name
    }).then((info) => {
      if (!cancelled) {
        setConnection(info);
        setTalkieTalkerStreamConfig({ wsUrl: info.wsUrl });
      }
    }).catch((err) => {
      if (!cancelled) {
        setConnectionError(err.message);
        onError?.(err.message);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [client, roomId, localParticipant, prejoinComplete, participant.name, onError]);
  React3.useEffect(() => {
    if (!customCssUrl) return;
    return applyCustomCss(customCssUrl);
  }, [customCssUrl]);
  const sessionEnabled = prejoinComplete && Boolean(connection?.token);
  const session = useRoomSession(roomId, sessionEnabled, hostUserId, {
    token: connection?.token,
    wsUrl: connection?.wsUrl,
    displayName: localParticipant.name,
    joinWithoutMedia: false
  });
  const resolvedFeatures = React3.useMemo(
    () => mergeRoomFeatures(
      featuresProp,
      session.projectFeatures,
      embedFeaturesToRoomFeatures(embedClaims.features)
    ),
    [featuresProp, session.projectFeatures, embedClaims.features]
  );
  const activeSpeakerId = session.participants.find((p) => p.handRaised)?.id ?? null;
  React3.useEffect(() => {
    if (session.connected) {
      onJoined?.(session.participants.find((p) => p.isLocal)?.id ?? null);
      postEmbedEvent({
        type: "talkietalker-stream:joined",
        payload: { roomId, participantId: session.participants.find((p) => p.isLocal)?.id }
      });
    }
  }, [session.connected, roomId, session.participants, onJoined]);
  React3.useEffect(() => {
    if (session.error) {
      const msg = session.error.description || session.error.title;
      onError?.(msg);
      postEmbedEvent({
        type: "talkietalker-stream:error",
        payload: { code: session.error.kind, message: msg }
      });
    }
  }, [session.error, onError]);
  const handleLeave = React3.useCallback(() => {
    session.leave();
    postEmbedEvent({ type: "talkietalker-stream:left", payload: { reason: "user" } });
    onLeave?.();
  }, [session, onLeave]);
  const waitingRoomBlocking = session.error?.code === "waiting_room_not_admitted" && isMeetingErrorBlocking(session.error, session.connected);
  if (!prejoinComplete) {
    return /* @__PURE__ */ jsxs4(
      "div",
      {
        className,
        style: {
          ...cssVars,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100%",
          background: "var(--sf-bg)",
          color: "var(--sf-text)",
          fontFamily: "var(--sf-font)",
          padding: 24,
          gap: 16
        },
        children: [
          logoUrl ? /* @__PURE__ */ jsx5(
            "img",
            {
              src: logoUrl,
              alt: "",
              style: { maxHeight: 48, maxWidth: 200, objectFit: "contain" }
            }
          ) : null,
          /* @__PURE__ */ jsx5("h2", { style: { margin: 0, fontSize: 20, fontWeight: 600 }, children: labels.prejoinTitle }),
          /* @__PURE__ */ jsx5(
            "input",
            {
              type: "text",
              value: localParticipant.name,
              onChange: (e) => setLocalParticipant((prev) => ({ ...prev, name: e.target.value })),
              placeholder: labels.displayNamePlaceholder,
              style: {
                width: "100%",
                maxWidth: 320,
                padding: "10px 12px",
                borderRadius: "var(--sf-radius)",
                border: "1px solid var(--sf-border)",
                background: "var(--sf-surface)",
                color: "var(--sf-text)",
                fontSize: 14
              }
            }
          ),
          /* @__PURE__ */ jsx5(
            "button",
            {
              type: "button",
              onClick: () => setPrejoinComplete(true),
              disabled: !localParticipant.name.trim(),
              style: {
                padding: "10px 20px",
                borderRadius: "var(--sf-radius)",
                border: "none",
                background: "var(--sf-primary)",
                color: "#fff",
                fontSize: 14,
                cursor: localParticipant.name.trim() ? "pointer" : "not-allowed",
                opacity: localParticipant.name.trim() ? 1 : 0.6
              },
              children: labels.joinButton
            }
          ),
          showBranding !== false ? /* @__PURE__ */ jsx5("footer", { style: { marginTop: "auto", fontSize: 12, color: "var(--sf-muted)" }, children: labels.poweredBy }) : null
        ]
      }
    );
  }
  if (headless && renderParticipant) {
    return /* @__PURE__ */ jsx5("div", { className, style: cssVars, children: session.participants.map((p) => /* @__PURE__ */ jsx5(React3.Fragment, { children: renderParticipant(p) }, p.id)) });
  }
  if (connectionError && prejoinComplete) {
    return /* @__PURE__ */ jsx5("div", { className, style: { padding: 24, color: "#f87171" }, children: connectionError });
  }
  if (!connection && prejoinComplete) {
    return /* @__PURE__ */ jsx5("div", { className, style: { padding: 24 }, children: labels.connecting });
  }
  return /* @__PURE__ */ jsxs4(
    "div",
    {
      className,
      style: {
        ...cssVars,
        display: "flex",
        flexDirection: "column",
        minHeight: "100%",
        background: "var(--sf-bg)",
        color: "var(--sf-text)",
        fontFamily: "var(--sf-font)",
        position: "relative"
      },
      "data-ws-url": connection?.wsUrl,
      children: [
        logoUrl ? /* @__PURE__ */ jsx5("header", { style: { padding: "12px 16px", borderBottom: "1px solid var(--sf-border)" }, children: /* @__PURE__ */ jsx5(
          "img",
          {
            src: logoUrl,
            alt: "",
            style: { maxHeight: 32, maxWidth: 160, objectFit: "contain" }
          }
        ) }) : null,
        session.error && isMeetingErrorBlocking(session.error, session.connected) ? /* @__PURE__ */ jsxs4("div", { style: { padding: 24, color: "#f87171" }, children: [
          waitingRoomBlocking ? labels.waitingRoomTitle : null,
          !waitingRoomBlocking ? /* @__PURE__ */ jsxs4(Fragment2, { children: [
            session.error.title,
            ": ",
            session.error.description
          ] }) : null
        ] }) : /* @__PURE__ */ jsxs4(Fragment2, { children: [
          /* @__PURE__ */ jsx5("div", { style: { flex: 1, display: "flex", minHeight: 0 }, children: renderParticipant ? /* @__PURE__ */ jsx5("div", { style: { display: "grid", gap: 12, padding: 16, width: "100%" }, children: session.participants.map((p) => /* @__PURE__ */ jsx5(React3.Fragment, { children: renderParticipant(p) }, p.id)) }) : /* @__PURE__ */ jsx5(
            RoomVideoGrid,
            {
              participants: session.participants,
              activeSpeakerId
            }
          ) }),
          /* @__PURE__ */ jsx5(
            RoomControls,
            {
              micMuted: session.micMuted,
              videoOff: session.videoOff,
              isScreenSharing: session.isScreenSharing,
              onToggleMic: session.toggleMic,
              onToggleVideo: session.toggleVideo,
              onToggleScreenShare: session.toggleScreenShare,
              onLeave: handleLeave,
              screenShareEnabled: resolvedFeatures.screenShare !== false,
              labels
            }
          ),
          showBranding !== false ? /* @__PURE__ */ jsx5(
            "footer",
            {
              style: {
                textAlign: "center",
                padding: "8px 16px",
                fontSize: 12,
                color: "var(--sf-muted)",
                borderTop: "1px solid var(--sf-border)"
              },
              children: labels.poweredBy
            }
          ) : null
        ] }),
        session.connecting ? /* @__PURE__ */ jsx5(
          "div",
          {
            style: {
              position: "absolute",
              inset: 0,
              display: "grid",
              placeItems: "center",
              background: "color-mix(in srgb, var(--sf-bg) 80%, transparent)"
            },
            children: labels.connecting
          }
        ) : null
      ]
    }
  );
}

export {
  parseEmbedClaims,
  parseEmbedExpiryMs,
  brandingToTheme,
  embedFeaturesToRoomFeatures,
  ConfigurationError,
  TalkieTalkerStreamClient,
  resolveLabels,
  TalkieTalkerStream,
  useTalkieTalkerStreamClient,
  TalkieTalkerStreamProvider,
  RoomControls,
  VideoTile,
  RoomVideoGrid,
  postEmbedEvent,
  isEmbedBridgeEvent,
  TalkieTalkerRoom
};
//# sourceMappingURL=chunk-Y3MYHG5Z.js.map