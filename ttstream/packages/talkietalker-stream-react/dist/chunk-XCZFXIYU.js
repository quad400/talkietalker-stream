import {
  useSignalingSocket
} from "./chunk-3POXSNJG.js";
import {
  PeerConnectionManager
} from "./chunk-VWJHHDJX.js";
import {
  serializeIceCandidate,
  signalingErrorMessage,
  signalingLog,
  signalingWarn
} from "./chunk-7OFM7NYG.js";

// src/signaling/use-broadcast-viewer.ts
import * as React from "react";
function useBroadcastViewer(streamId, enabled = true, options) {
  const [remoteStream, setRemoteStream] = React.useState(
    null
  );
  const [connected, setConnected] = React.useState(false);
  const [connecting, setConnecting] = React.useState(false);
  const [playing, setPlaying] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [connectionQuality, setConnectionQuality] = React.useState("unknown");
  const [pcReady, setPcReady] = React.useState(false);
  const pcManagerRef = React.useRef(null);
  const trackMapRef = React.useRef(/* @__PURE__ */ new Map());
  const joinSentRef = React.useRef(false);
  const signalingAcceptedRef = React.useRef(false);
  const iceAllowedRef = React.useRef(false);
  const pendingOffersRef = React.useRef([]);
  const sendRef = React.useRef(
    () => {
    }
  );
  const reportError = React.useCallback((message) => {
    signalingWarn(message);
    setConnecting(false);
    setConnected(false);
    setPlaying(false);
    setError(message);
  }, []);
  const processOffer = React.useCallback(
    async (sdp) => {
      const pcm = pcManagerRef.current;
      if (!pcm) {
        pendingOffersRef.current.push(sdp);
        signalingLog("queued offer until peer connection is ready");
        return;
      }
      try {
        const answerSdp = await pcm.handleRemoteOffer(sdp);
        if (answerSdp) {
          iceAllowedRef.current = true;
          sendRef.current({ type: "answer", sdp: answerSdp });
        }
      } catch (err) {
        reportError(
          err instanceof Error ? err.message : "Failed to negotiate WebRTC session"
        );
      }
    },
    [reportError]
  );
  const flushPendingOffers = React.useCallback(async () => {
    const offers = [...pendingOffersRef.current];
    pendingOffersRef.current = [];
    for (const sdp of offers) {
      await processOffer(sdp);
    }
  }, [processOffer]);
  const handleMessage = React.useCallback(
    async (message) => {
      switch (message.type) {
        case "joined":
          signalingAcceptedRef.current = true;
          iceAllowedRef.current = true;
          setConnected(true);
          setConnecting(false);
          await flushPendingOffers();
          break;
        case "offer":
          await processOffer(message.sdp);
          break;
        case "ice_candidate": {
          const pcm = pcManagerRef.current;
          if (!pcm) return;
          try {
            await pcm.handleRemoteCandidate(message.candidate);
          } catch (err) {
            signalingWarn("failed to add remote ICE candidate", err);
          }
          break;
        }
        case "stream_ended":
          setConnected(false);
          setPlaying(false);
          setRemoteStream(null);
          trackMapRef.current = /* @__PURE__ */ new Map();
          setError("Stream ended");
          break;
        case "error":
          reportError(signalingErrorMessage(message));
          break;
        default:
          break;
      }
    },
    [flushPendingOffers, processOffer, reportError]
  );
  const joinStream = React.useCallback(() => {
    joinSentRef.current = true;
    sendRef.current({ type: "join", stream_id: streamId });
  }, [streamId]);
  const handleSocketError = React.useCallback(
    (message) => reportError(message),
    [reportError]
  );
  const { send, close } = useSignalingSocket(
    enabled && Boolean(streamId) && pcReady,
    handleMessage,
    joinStream,
    { onError: handleSocketError, autoReconnect: true, token: options?.token }
  );
  sendRef.current = send;
  React.useEffect(() => {
    if (!enabled || !streamId) return;
    setConnecting(true);
    setError(null);
    setPlaying(false);
    setPcReady(false);
    joinSentRef.current = false;
    signalingAcceptedRef.current = false;
    iceAllowedRef.current = false;
    pendingOffersRef.current = [];
    trackMapRef.current = /* @__PURE__ */ new Map();
    const pcm = new PeerConnectionManager(
      {
        onIceCandidate: (candidate) => {
          if (!iceAllowedRef.current) return;
          sendRef.current({
            type: "ice_candidate",
            candidate: serializeIceCandidate(candidate)
          });
        },
        onTrack: (track, streams) => {
          signalingLog("viewer remote track", track.kind);
          if (streams.length > 0) {
            for (const t of streams[0].getTracks()) {
              trackMapRef.current.set(t.kind, t);
            }
          } else {
            trackMapRef.current.set(track.kind, track);
          }
          const next = new MediaStream(
            Array.from(trackMapRef.current.values())
          );
          setRemoteStream(next);
          setPlaying(true);
        },
        onConnectionStateChange: (state) => {
          if (state === "connected") setPlaying(true);
          if (state === "failed") reportError("WebRTC connection failed");
        },
        onIceFailure: () => {
          signalingWarn("ICE connection failed \u2014 viewer may need to refresh");
        },
        onStatsUpdate: (_stats, quality) => {
          setConnectionQuality(quality);
        }
      }
    );
    pcManagerRef.current = pcm;
    pcm.startStatsPolling();
    setPcReady(true);
    const timeout = window.setTimeout(() => {
      if (!signalingAcceptedRef.current) {
        reportError("Timed out waiting for stream join confirmation");
      }
    }, 2e4);
    return () => {
      window.clearTimeout(timeout);
      sendRef.current({ type: "leave" });
      close();
      pcm.close();
      pcManagerRef.current = null;
      trackMapRef.current = /* @__PURE__ */ new Map();
      joinSentRef.current = false;
      signalingAcceptedRef.current = false;
      iceAllowedRef.current = false;
      pendingOffersRef.current = [];
      setPcReady(false);
      setRemoteStream(null);
      setConnected(false);
      setPlaying(false);
    };
  }, [close, enabled, reportError, streamId]);
  return {
    remoteStream,
    connected,
    connecting,
    playing,
    error,
    connectionQuality
  };
}

export {
  useBroadcastViewer
};
//# sourceMappingURL=chunk-XCZFXIYU.js.map