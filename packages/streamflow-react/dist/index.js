import {
  ConfigurationError,
  StreamFlow,
  StreamFlowClient,
  StreamFlowProvider,
  StreamFlowRoom,
  brandingToTheme,
  embedFeaturesToRoomFeatures,
  isEmbedBridgeEvent,
  parseEmbedClaims,
  parseEmbedExpiryMs,
  postEmbedEvent,
  resolveLabels,
  useStreamFlowClient
} from "./chunk-CO4PISZG.js";
import {
  useBroadcastViewer
} from "./chunk-FBZQ4VAI.js";
import "./chunk-YUHR4S2U.js";
import "./chunk-LQG3EZ37.js";
import "./chunk-J3H4LAQR.js";
import "./chunk-U7MD5TET.js";
import "./chunk-GWIKW3Y4.js";
import {
  applyCustomCss,
  getStreamFlowConfig,
  resolveWsUrlFromPublishKey,
  setStreamFlowConfig,
  themeToCssVars
} from "./chunk-6JT6IE2I.js";

// src/player/streamflow-player.tsx
import * as React from "react";
import { jsx, jsxs } from "react/jsx-runtime";
function StreamFlowPlayer({
  streamId,
  token,
  wsUrl,
  theme = "dark",
  className,
  onPaymentRequired
}) {
  const providerConfig = getStreamFlowConfig();
  const cssVars = React.useMemo(
    () => themeToCssVars(providerConfig.theme, theme),
    [providerConfig.theme, theme]
  );
  React.useEffect(() => {
    if (wsUrl) setStreamFlowConfig({ wsUrl });
  }, [wsUrl]);
  const videoRef = React.useRef(null);
  const viewer = useBroadcastViewer(streamId, true, { token });
  React.useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.srcObject = viewer.remoteStream;
    if (viewer.remoteStream) void video.play().catch(() => void 0);
  }, [viewer.remoteStream]);
  React.useEffect(() => {
    if (viewer.connected) {
      postEmbedEvent({ type: "streamflow:joined", payload: { streamId } });
    }
  }, [viewer.connected, streamId]);
  React.useEffect(() => {
    if (!viewer.error) return;
    if (viewer.error.toLowerCase().includes("payment")) {
      onPaymentRequired?.({ streamId, message: viewer.error });
    }
    postEmbedEvent({
      type: "streamflow:error",
      payload: { message: viewer.error }
    });
  }, [viewer.error, streamId, onPaymentRequired]);
  return /* @__PURE__ */ jsxs(
    "div",
    {
      className,
      style: {
        ...cssVars,
        background: "var(--sf-bg)",
        color: "var(--sf-text)",
        minHeight: 200,
        position: "relative"
      },
      children: [
        /* @__PURE__ */ jsx(
          "video",
          {
            ref: videoRef,
            autoPlay: true,
            playsInline: true,
            controls: true,
            style: { width: "100%", aspectRatio: "16/9", background: "#000" }
          }
        ),
        viewer.connecting ? /* @__PURE__ */ jsx("div", { style: { position: "absolute", inset: 0, display: "grid", placeItems: "center" }, children: "Connecting\u2026" }) : null,
        viewer.error ? /* @__PURE__ */ jsx("div", { style: { padding: 12, color: "#f87171" }, children: viewer.error }) : null
      ]
    }
  );
}
export {
  ConfigurationError,
  StreamFlow,
  StreamFlowClient,
  StreamFlowPlayer,
  StreamFlowProvider,
  StreamFlowRoom,
  applyCustomCss,
  brandingToTheme,
  embedFeaturesToRoomFeatures,
  isEmbedBridgeEvent,
  parseEmbedClaims,
  parseEmbedExpiryMs,
  postEmbedEvent,
  resolveLabels,
  resolveWsUrlFromPublishKey,
  themeToCssVars,
  useStreamFlowClient
};
//# sourceMappingURL=index.js.map