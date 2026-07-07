import {
  DEFAULT_CAMERA_VIDEO_CONSTRAINTS,
  signalingLog,
  signalingWarn
} from "./chunk-7OFM7NYG.js";

// src/signaling/media-device-manager.ts
var STAGE_RECORDING_STREAM_ID = "__talkietalker_stream_stage_recording__";
var DEFAULT_AUDIO_CONSTRAINTS = {
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
  sampleRate: 48e3,
  channelCount: 1
};
var DEFAULT_VIDEO_CONSTRAINTS = DEFAULT_CAMERA_VIDEO_CONSTRAINTS;
var SCREEN_SHARE_VIDEO_CONSTRAINTS = {
  width: { ideal: 1920 },
  height: { ideal: 1080 },
  frameRate: { ideal: 30, max: 30 }
};
var STAGE_RECORDING_READY_TIMEOUT_MS = 1e4;
var STAGE_RECORDING_POLL_INTERVAL_MS = 100;
var STAGE_RECORDING_SOFT_READY_MS = 1e3;
function mapMediaError(err) {
  if (!(err instanceof DOMException)) {
    return {
      code: "unknown",
      message: "Failed to access media devices",
      original: err
    };
  }
  switch (err.name) {
    case "NotAllowedError":
    case "PermissionDeniedError":
      return {
        code: "not_allowed",
        message: "Camera/microphone permission denied",
        original: err
      };
    case "NotFoundError":
    case "DevicesNotFoundError":
      return {
        code: "not_found",
        message: "No camera or microphone found",
        original: err
      };
    case "NotReadableError":
    case "TrackStartError":
      return {
        code: "not_readable",
        message: "Camera or microphone is already in use",
        original: err
      };
    case "OverconstrainedError":
      return {
        code: "overconstrained",
        message: "Camera does not meet the requested constraints",
        original: err
      };
    default:
      return {
        code: "unknown",
        message: err.message || "Failed to access media devices",
        original: err
      };
  }
}
function tagStageRecordingStream(stream) {
  Object.defineProperty(stream, "id", {
    value: STAGE_RECORDING_STREAM_ID,
    configurable: true
  });
  return stream;
}
function stageRecordingOutboundActive(stats) {
  for (const report of stats.values()) {
    if (report.type !== "outbound-rtp") continue;
    const bytesSent = "bytesSent" in report ? report.bytesSent : 0;
    const framesEncoded = "framesEncoded" in report ? report.framesEncoded : 0;
    if (typeof bytesSent === "number" && bytesSent > 0 || typeof framesEncoded === "number" && framesEncoded > 0) {
      if (!("kind" in report) || report.kind === "video") {
        return true;
      }
    }
  }
  return false;
}
function requestVideoFrame(track) {
  if (!track || !("requestFrame" in track)) return;
  const requestFrame = track.requestFrame;
  if (typeof requestFrame === "function") {
    requestFrame.call(track);
  }
}
function stageRecordingSenderIsSendCapable(pc, sender) {
  const transceiver = pc.getTransceivers().find((item) => item.sender === sender);
  if (!transceiver) return false;
  const direction = transceiver.currentDirection ?? transceiver.direction;
  return direction === "sendonly" || direction === "sendrecv";
}
function isVideoTransceiver(transceiver) {
  if (transceiver.sender.track?.kind === "video") return true;
  if (transceiver.receiver.track?.kind === "video") return true;
  return false;
}
function findStageRecordingTransceiver(pc) {
  const videoTransceivers = pc.getTransceivers().filter((transceiver) => isVideoTransceiver(transceiver));
  if (videoTransceivers.length >= 2) {
    return videoTransceivers[1];
  }
  const transceivers = pc.getTransceivers();
  if (transceivers.length >= 3) {
    return transceivers[2];
  }
  return void 0;
}
var MediaDeviceManager = class {
  stageRecordingSenders = /* @__PURE__ */ new WeakMap();
  stagePlaceholderStream = null;
  getStageRecordingPlaceholderTrack() {
    if (!this.stagePlaceholderStream) {
      const canvas = document.createElement("canvas");
      canvas.width = 2;
      canvas.height = 2;
      const ctx = canvas.getContext("2d");
      ctx?.fillRect(0, 0, 2, 2);
      this.stagePlaceholderStream = tagStageRecordingStream(
        canvas.captureStream(5)
      );
    }
    const track = this.stagePlaceholderStream.getVideoTracks()[0];
    if (!track || track.readyState === "ended") {
      this.stagePlaceholderStream = null;
      return this.getStageRecordingPlaceholderTrack();
    }
    return track;
  }
  async getUserMedia(constraints) {
    const resolved = constraints ?? {
      audio: DEFAULT_AUDIO_CONSTRAINTS,
      video: DEFAULT_VIDEO_CONSTRAINTS
    };
    try {
      const stream = await navigator.mediaDevices.getUserMedia(resolved);
      signalingLog("getUserMedia acquired", {
        audio: stream.getAudioTracks().length,
        video: stream.getVideoTracks().length
      });
      return stream;
    } catch (err) {
      const mapped = mapMediaError(err);
      signalingWarn("getUserMedia failed", mapped);
      throw new Error(mapped.message);
    }
  }
  async getDisplayMedia() {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: SCREEN_SHARE_VIDEO_CONSTRAINTS,
        audio: {
          echoCancellation: false,
          noiseSuppression: false
        }
      });
      signalingLog("getDisplayMedia acquired");
      return stream;
    } catch (err) {
      const mapped = mapMediaError(err);
      signalingWarn("getDisplayMedia failed", mapped);
      throw new Error(mapped.message);
    }
  }
  isStageRecordingSender(pc, sender) {
    return this.stageRecordingSenders.get(pc) === sender;
  }
  async replaceTrack(pc, newTrack) {
    const sender = this.findSenderForKind(pc, newTrack.kind);
    if (!sender) {
      throw new Error(`No sender found for ${newTrack.kind} track`);
    }
    await sender.replaceTrack(newTrack);
    signalingLog("replaceTrack complete", newTrack.kind);
  }
  /** Attach or swap a local track, reusing an SFU video transceiver when needed. */
  async addOrReplaceTrack(pc, stream, track) {
    const sender = this.findSenderForKind(pc, track.kind);
    if (sender) {
      await sender.replaceTrack(track);
      const transceiver = pc.getTransceivers().find((item) => item.sender === sender);
      if (transceiver && !this.isStageRecordingSender(pc, sender) && (transceiver.direction === "recvonly" || transceiver.direction === "inactive")) {
        transceiver.direction = "sendrecv";
      }
    } else {
      const transceiver = pc.addTransceiver(track, {
        direction: "sendrecv",
        streams: [stream]
      });
      void transceiver.sender.replaceTrack(track);
    }
    signalingLog("addOrReplaceTrack complete", track.kind);
  }
  /** Stop local capture tracks and detach them from the peer connection. */
  async releaseLocalTrack(pc, stream, kind, options) {
    const tracks = kind === "audio" ? [...stream.getAudioTracks()] : [...stream.getVideoTracks()];
    for (const track of tracks) {
      stream.removeTrack(track);
      track.stop();
    }
    if (!options?.keepSender) {
      const sender = this.findSenderForKind(pc, kind);
      if (sender) {
        sender.track?.stop();
        await sender.replaceTrack(null).catch(() => void 0);
      }
    }
    signalingLog("releaseLocalTrack complete", kind);
  }
  findSenderForKind(pc, kind) {
    const stageSender = this.stageRecordingSenders.get(pc);
    const direct = pc.getSenders().find(
      (sender) => sender !== stageSender && sender.track?.kind === kind
    );
    if (direct) return direct;
    return pc.getTransceivers().find((transceiver) => {
      if (transceiver.sender === stageSender) return false;
      return transceiver.sender.track?.kind === kind || transceiver.receiver.track?.kind === kind;
    })?.sender;
  }
  muteTrack(track) {
    track.enabled = false;
  }
  unmuteTrack(track) {
    track.enabled = true;
  }
  stopStream(stream) {
    stream?.getTracks().forEach((track) => track.stop());
  }
  stopTrack(track) {
    track.stop();
  }
  async ensureStageRecordingTransceiver(pc) {
    let transceiver = findStageRecordingTransceiver(pc);
    const existing = this.stageRecordingSenders.get(pc);
    if (existing) {
      transceiver = pc.getTransceivers().find((item) => item.sender === existing) ?? transceiver;
    }
    if (!transceiver) {
      throw new Error("Stage recording transceiver not available from SFU offer");
    }
    transceiver.direction = "sendonly";
    const sender = transceiver.sender;
    this.stageRecordingSenders.set(pc, sender);
    if (!sender.track || sender.track.readyState === "ended") {
      const placeholder = this.getStageRecordingPlaceholderTrack();
      await sender.replaceTrack(placeholder);
    }
    signalingLog("stage recording transceiver bound", {
      mid: transceiver.mid,
      transceivers: pc.getTransceivers().length
    });
    return sender;
  }
  async publishStageRecordingTrack(pc, stream) {
    const tagged = tagStageRecordingStream(stream);
    const track = tagged.getVideoTracks()[0];
    if (!track) {
      throw new Error("Stage recording stream has no video track");
    }
    if (track.readyState === "ended") {
      throw new Error("Stage recording compositor track is not live");
    }
    const sender = await this.ensureStageRecordingTransceiver(pc);
    await sender.replaceTrack(track);
    requestVideoFrame(track);
    await this.waitForStageRecordingReady(pc, sender);
    signalingLog("stage recording track published");
  }
  async unpublishStageRecordingTrack(pc) {
    const sender = this.stageRecordingSenders.get(pc);
    if (!sender) return;
    const placeholder = this.getStageRecordingPlaceholderTrack();
    await sender.replaceTrack(placeholder);
    signalingLog("stage recording track unpublished");
  }
  async waitForStageRecordingReady(pc, sender, timeoutMs = STAGE_RECORDING_READY_TIMEOUT_MS) {
    const deadline = Date.now() + timeoutMs;
    const startedAt = Date.now();
    const connectionReady = () => {
      const state = pc.connectionState;
      return state === "connected" || state === "connecting";
    };
    while (Date.now() < deadline) {
      const track = sender.track;
      const connReady = connectionReady();
      const trackLive = track?.readyState === "live";
      const sendCapable = stageRecordingSenderIsSendCapable(pc, sender);
      requestVideoFrame(track);
      if (trackLive && connReady) {
        const stats = await sender.getStats();
        if (stageRecordingOutboundActive(stats)) {
          return;
        }
        const iceReady = pc.iceConnectionState === "connected" || pc.iceConnectionState === "completed";
        const elapsed = Date.now() - startedAt;
        if (elapsed >= STAGE_RECORDING_SOFT_READY_MS && sendCapable && pc.connectionState === "connected" && iceReady) {
          return;
        }
      }
      await new Promise(
        (resolve) => window.setTimeout(resolve, STAGE_RECORDING_POLL_INTERVAL_MS)
      );
    }
    throw new Error("Stage recording track did not become ready");
  }
};
var mediaDeviceManager = new MediaDeviceManager();

export {
  STAGE_RECORDING_STREAM_ID,
  tagStageRecordingStream,
  mediaDeviceManager
};
//# sourceMappingURL=chunk-VHZN6RVW.js.map