import {
  mediaDeviceManager
} from "./chunk-J3H4LAQR.js";
import {
  DEFAULT_RTC_CONFIG,
  SIMULCAST_LAYERS
} from "./chunk-GWIKW3Y4.js";
import {
  DEFAULT_VIDEO_QUALITY_TIER,
  SCREEN_SHARE_ENCODING,
  getVideoQualityProfile,
  isCameraVideoTrack,
  isScreenShareVideoTrack,
  logSdpAnalysis,
  normalizeSdp,
  normalizeSdpText,
  parseIceCandidateInit,
  sanitizeSdpSafe,
  signalingLog,
  signalingWarn,
  validateRoomModeSdp
} from "./chunk-6JT6IE2I.js";

// src/signaling/ice-restart-handler.ts
var MAX_RETRIES = 4;
var INITIAL_DELAY_MS = 400;
var MAX_DELAY_MS = 4e3;
var IceRestartHandler = class {
  retryCount = 0;
  retryDelay = INITIAL_DELAY_MS;
  timer = null;
  aborted = false;
  async attemptRestart(pc, sendOffer) {
    if (this.aborted) return false;
    if (this.retryCount >= MAX_RETRIES) {
      signalingWarn(`ICE restart exhausted ${MAX_RETRIES} attempts`);
      return false;
    }
    this.retryCount++;
    signalingLog(
      `ICE restart attempt ${this.retryCount}/${MAX_RETRIES} in ${this.retryDelay}ms`
    );
    await new Promise((resolve) => {
      this.timer = setTimeout(resolve, this.retryDelay);
    });
    if (this.aborted) return false;
    this.retryDelay = Math.min(this.retryDelay * 2, MAX_DELAY_MS);
    try {
      const offer = await pc.createOffer({ iceRestart: true });
      await pc.setLocalDescription(offer);
      if (offer.sdp) {
        sendOffer(offer.sdp);
        signalingLog("ICE restart offer sent");
        return true;
      }
      signalingWarn("ICE restart produced empty offer");
      return false;
    } catch (error) {
      signalingWarn("ICE restart failed", error);
      return false;
    }
  }
  reset() {
    this.retryCount = 0;
    this.retryDelay = INITIAL_DELAY_MS;
    this.clearTimer();
  }
  dispose() {
    this.aborted = true;
    this.clearTimer();
  }
  get exhausted() {
    return this.retryCount >= MAX_RETRIES;
  }
  clearTimer() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
};

// src/signaling/stats-collector.ts
var POLL_INTERVAL_MS = 2e3;
function deriveQuality({
  roundTripTime,
  lossDelta
}) {
  const rtt = roundTripTime;
  if (rtt <= 0) {
    if (lossDelta === 0) return "unknown";
    if (lossDelta < 5) return "poor";
    return "poor";
  }
  if (rtt < 50 && lossDelta === 0) return "excellent";
  if (rtt < 150 && lossDelta < 3) return "good";
  if (rtt < 400 && lossDelta < 10) return "poor";
  return "bad";
}
function parseStatsReport(report) {
  const stats = {
    audioPacketsLost: 0,
    videoPacketsLost: 0,
    audioJitter: 0,
    videoFrameRate: 0,
    roundTripTime: 0,
    availableOutgoingBitrate: 0,
    currentResolution: "",
    inboundVideoResolution: "",
    inboundVideoResolutionsByTrackId: {},
    outboundVideoRetransmissions: 0,
    timestamp: Date.now()
  };
  report.forEach((entry) => {
    switch (entry.type) {
      case "inbound-rtp":
        if (entry.kind === "audio") {
          stats.audioPacketsLost += entry.packetsLost ?? 0;
          stats.audioJitter = Math.max(stats.audioJitter, entry.jitter ?? 0);
        }
        if (entry.kind === "video") {
          stats.videoPacketsLost += entry.packetsLost ?? 0;
          stats.videoFrameRate = Math.max(
            stats.videoFrameRate,
            entry.framesPerSecond ?? 0
          );
          if (entry.frameWidth && entry.frameHeight) {
            const resolution = `${entry.frameWidth}\xD7${entry.frameHeight}`;
            stats.currentResolution = resolution;
            const pixels = entry.frameWidth * entry.frameHeight;
            const currentBest = stats.inboundVideoResolution ? Number.parseInt(stats.inboundVideoResolution.split("\xD7")[0] ?? "0", 10) * Number.parseInt(stats.inboundVideoResolution.split("\xD7")[1] ?? "0", 10) : 0;
            if (pixels >= currentBest) {
              stats.inboundVideoResolution = resolution;
            }
            const trackId = entry.trackIdentifier;
            if (trackId) {
              stats.inboundVideoResolutionsByTrackId[trackId] = resolution;
            }
          }
        }
        break;
      case "outbound-rtp":
        if (entry.kind === "video") {
          stats.outboundVideoRetransmissions += entry.retransmittedPacketsSent ?? 0;
        }
        break;
      case "candidate-pair":
        if (entry.state === "succeeded" && entry.nominated) {
          const rtt = (entry.currentRoundTripTime ?? 0) * 1e3;
          if (rtt > 0) {
            stats.roundTripTime = rtt;
          }
          stats.availableOutgoingBitrate = entry.availableOutgoingBitrate ?? stats.availableOutgoingBitrate;
        }
        break;
    }
  });
  return stats;
}
var StatsCollector = class {
  interval = null;
  pc = null;
  previousAudioLoss = 0;
  previousOutboundVideoRetransmissions = 0;
  start(pc, onStats) {
    this.stop();
    this.pc = pc;
    this.previousAudioLoss = 0;
    this.previousOutboundVideoRetransmissions = 0;
    this.interval = setInterval(async () => {
      if (!this.pc || this.pc.connectionState === "closed") {
        this.stop();
        return;
      }
      try {
        const report = await this.pc.getStats();
        const parsed = parseStatsReport(report);
        const audioLossDelta = Math.max(
          0,
          parsed.audioPacketsLost - this.previousAudioLoss
        );
        const retransmitDelta = Math.max(
          0,
          parsed.outboundVideoRetransmissions - this.previousOutboundVideoRetransmissions
        );
        this.previousAudioLoss = parsed.audioPacketsLost;
        this.previousOutboundVideoRetransmissions = parsed.outboundVideoRetransmissions;
        const lossDelta = audioLossDelta + Math.ceil(retransmitDelta / 5);
        const quality = deriveQuality({
          roundTripTime: parsed.roundTripTime,
          lossDelta
        });
        onStats({ ...parsed, lossDelta }, quality);
      } catch {
      }
    }, POLL_INTERVAL_MS);
  }
  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.pc = null;
    this.previousAudioLoss = 0;
    this.previousOutboundVideoRetransmissions = 0;
  }
};

// src/signaling/peer-connection-manager.ts
var DEFAULT_PEER_CONNECTION_OPTIONS = {
  simulcast: false,
  sdpSanitization: "legacy",
  waitForIceGathering: true,
  iceGatheringTimeoutMs: 5e3,
  answerValidation: "strict",
  maxPendingIceCandidates: 256
};
var ROOM_PEER_CONNECTION_OPTIONS = {
  simulcast: false,
  sdpSanitization: "safe",
  waitForIceGathering: false,
  iceGatheringTimeoutMs: 500,
  answerValidation: "warn",
  maxPendingIceCandidates: 512
};
var SESSION_ATTRS_REQUIRING_MEDIA = /* @__PURE__ */ new Set([
  "extmap-allow-mixed",
  "rtpmap",
  "fmtp",
  "rtcp-fb",
  "extmap"
]);
function resolveOptions(options) {
  const merged = { ...DEFAULT_PEER_CONNECTION_OPTIONS, ...options };
  if (options?.sanitizeOfferSdp !== void 0 && !options.sdpSanitization) {
    merged.sdpSanitization = options.sanitizeOfferSdp ? "legacy" : "none";
  }
  if (options?.strictAnswerValidation !== void 0 && !options.answerValidation) {
    merged.answerValidation = options.strictAnswerValidation ? "strict" : "off";
  }
  return merged;
}
function describeSdp(sdp) {
  if (!sdp) {
    return {
      hasIceUfrag: false,
      hasIcePwd: false,
      hasFingerprint: false,
      hasSetup: false,
      mediaLines: 0,
      lineCount: 0,
      hasSendrecv: false,
      hasRecvonly: false,
      hasSendonly: false
    };
  }
  const lines = sdp.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  return {
    hasIceUfrag: lines.some((l) => l.startsWith("a=ice-ufrag:")),
    hasIcePwd: lines.some((l) => l.startsWith("a=ice-pwd:")),
    hasFingerprint: lines.some((l) => l.startsWith("a=fingerprint:")),
    hasSetup: lines.some((l) => l.startsWith("a=setup:")),
    mediaLines: lines.filter((l) => l.startsWith("m=")).length,
    lineCount: lines.length,
    hasSendrecv: lines.some((l) => l.includes("a=sendrecv")),
    hasRecvonly: lines.some((l) => l.includes("a=recvonly")),
    hasSendonly: lines.some((l) => l.includes("a=sendonly"))
  };
}
function sanitizeRemoteOfferSdpLegacy(sdp) {
  const normalized = normalizeSdpText(sdp).replace(/\r\n/g, "\n").trim();
  const lines = normalized.split("\n");
  const firstMediaIndex = lines.findIndex((l) => l.trim().startsWith("m="));
  const sanitized = lines.filter((line, index) => {
    const trimmed = line.trim();
    if (firstMediaIndex !== -1 && index >= firstMediaIndex) return true;
    if (!trimmed.startsWith("a=")) return true;
    const attr = trimmed.slice(2).split(":")[0]?.trim();
    if (attr === "extmap-allow-mixed") return false;
    if (firstMediaIndex === -1 && SESSION_ATTRS_REQUIRING_MEDIA.has(attr ?? "")) {
      return false;
    }
    return true;
  });
  return `${sanitized.join("\r\n")}\r
`;
}
function prepareRemoteOfferSdp(sdp, mode) {
  const raw = normalizeSdp(sdp) ?? sdp;
  switch (mode) {
    case "none":
      return normalizeSdpText(raw);
    case "safe":
      return sanitizeSdpSafe(raw);
    case "legacy":
      return sanitizeRemoteOfferSdpLegacy(raw);
  }
}
async function setRemoteOfferDescription(pc, sdp, mode) {
  const prepared = prepareRemoteOfferSdp(sdp, mode);
  try {
    await pc.setRemoteDescription({ type: "offer", sdp: prepared });
    return;
  } catch (firstError) {
    if (mode === "none") throw firstError;
    signalingWarn("setRemoteDescription failed with prepared SDP, retrying raw", {
      mode,
      error: firstError
    });
    const fallback = normalizeSdpText(sdp);
    try {
      await pc.setRemoteDescription({ type: "offer", sdp: fallback });
      return;
    } catch {
      await pc.setRemoteDescription({ type: "offer", sdp });
    }
  }
}
function waitForIceGathering(pc, timeoutMs) {
  if (pc.iceGatheringState === "complete") return Promise.resolve();
  return new Promise((resolve) => {
    const timeout = window.setTimeout(() => {
      pc.removeEventListener("icegatheringstatechange", onChange);
      signalingLog("ICE gathering timeout \u2014 sending answer with trickle ICE");
      resolve();
    }, timeoutMs);
    function onChange() {
      if (pc.iceGatheringState === "complete") {
        window.clearTimeout(timeout);
        pc.removeEventListener("icegatheringstatechange", onChange);
        resolve();
      }
    }
    pc.addEventListener("icegatheringstatechange", onChange);
  });
}
function validateAnswerSdp(sdp, mode, transceiverCount) {
  if (mode === "off") return null;
  const info = describeSdp(sdp);
  const roomCheck = validateRoomModeSdp(sdp, "answer");
  const issues = [];
  if (!info.hasIceUfrag || !info.hasFingerprint) {
    issues.push("answer missing ICE/DTLS attributes");
  }
  if (info.mediaLines === 0) {
    issues.push(
      `answer missing media sections (transceivers=${transceiverCount})`
    );
  }
  for (const issue of [...roomCheck.critical, ...issues]) {
    if (mode === "strict") {
      return issue;
    }
    signalingWarn(`answer validation: ${issue}`);
  }
  return null;
}
var PeerConnectionManager = class {
  pc;
  callbacks;
  options;
  offerChain = Promise.resolve();
  pendingCandidates = [];
  iceRestartHandler = new IceRestartHandler();
  statsCollector = new StatsCollector();
  disposed = false;
  currentVideoTier = DEFAULT_VIDEO_QUALITY_TIER;
  constructor(callbacks, config, options) {
    this.callbacks = callbacks;
    this.options = resolveOptions(options);
    this.pc = new RTCPeerConnection(config ?? DEFAULT_RTC_CONFIG);
    this.attachEventHandlers();
  }
  get connection() {
    return this.pc;
  }
  get connectionState() {
    return this.pc.connectionState;
  }
  get iceConnectionState() {
    return this.pc.iceConnectionState;
  }
  get videoQualityTier() {
    return this.currentVideoTier;
  }
  async applyVideoQualityTier(tier, track) {
    const sender = this.findPrimaryVideoSender();
    if (!sender?.track || sender.track.readyState === "ended") return false;
    const videoTrack = track ?? sender.track;
    if (!isCameraVideoTrack(videoTrack)) return false;
    const profile = getVideoQualityProfile(tier);
    try {
      await videoTrack.applyConstraints(profile.captureConstraints).catch(() => void 0);
      if ("contentHint" in videoTrack) {
        videoTrack.contentHint = "motion";
      }
      const encodingApplied = await this.applyEncodingParams(
        sender,
        profile.encodingParams,
        "maintain-resolution"
      );
      if (!encodingApplied) {
        signalingLog("video quality encoding deferred until sender is negotiated", {
          tier
        });
        return false;
      }
      this.currentVideoTier = tier;
      signalingLog("video quality tier applied", {
        tier,
        label: profile.label
      });
      return true;
    } catch (error) {
      const detail = error instanceof DOMException ? `${error.name}: ${error.message}` : error instanceof Error ? error.message : String(error);
      signalingWarn("video quality tier apply failed", { tier, error: detail });
      return false;
    }
  }
  async configureScreenShareSender(track) {
    const sender = this.findPrimaryVideoSender();
    if (!sender?.track || sender.track.readyState === "ended") return false;
    const videoTrack = track ?? sender.track;
    if (!isScreenShareVideoTrack(videoTrack)) return false;
    try {
      if ("contentHint" in videoTrack) {
        try {
          videoTrack.contentHint = SCREEN_SHARE_ENCODING.contentHint;
        } catch {
          videoTrack.contentHint = "text";
        }
      }
      const encodingApplied = await this.applyEncodingParams(
        sender,
        {
          maxBitrate: SCREEN_SHARE_ENCODING.maxBitrate,
          maxFramerate: SCREEN_SHARE_ENCODING.maxFramerate,
          scaleResolutionDownBy: SCREEN_SHARE_ENCODING.scaleResolutionDownBy
        },
        "maintain-resolution"
      );
      if (!encodingApplied) return false;
      signalingLog("screen share encoding applied");
      return true;
    } catch (error) {
      signalingWarn("screen share encoding apply failed", { error });
      return false;
    }
  }
  findPrimaryVideoSender() {
    return this.pc.getSenders().find(
      (item) => item.track?.kind === "video" && !mediaDeviceManager.isStageRecordingSender(this.pc, item)
    );
  }
  async applyEncodingParams(sender, encoding, degradationPreference) {
    const params = sender.getParameters();
    if (!params.encodings?.length) {
      return false;
    }
    params.degradationPreference = degradationPreference;
    params.encodings = [
      {
        ...params.encodings[0] ?? {},
        active: true,
        maxBitrate: encoding.maxBitrate,
        maxFramerate: encoding.maxFramerate,
        scaleResolutionDownBy: encoding.scaleResolutionDownBy
      }
    ];
    try {
      await sender.setParameters(params);
      return true;
    } catch (error) {
      if (degradationPreference !== "balanced") {
        return this.applyEncodingParams(sender, encoding, "balanced");
      }
      throw error;
    }
  }
  attachLocalTracks(localStream) {
    for (const track of localStream.getTracks()) {
      if (track.readyState === "ended") continue;
      const existing = this.pc.getSenders().find(
        (sender) => sender.track?.kind === track.kind && !mediaDeviceManager.isStageRecordingSender(this.pc, sender)
      ) ?? this.pc.getTransceivers().find(
        (transceiver) => !mediaDeviceManager.isStageRecordingSender(
          this.pc,
          transceiver.sender
        ) && (transceiver.sender.track?.kind === track.kind || transceiver.receiver.track?.kind === track.kind)
      )?.sender;
      if (existing) {
        void existing.replaceTrack(track).then(() => {
          if (track.kind === "video") {
            this.configureVideoSender(existing, track);
          }
        });
      } else {
        const sender = this.pc.addTrack(track, localStream);
        if (track.kind === "video") {
          this.configureVideoSender(sender, track);
        }
      }
    }
  }
  ensureRecvTransceivers() {
    const transceivers = this.pc.getTransceivers();
    const hasAudio = transceivers.some(
      (t) => t.sender.track?.kind === "audio" || t.receiver.track?.kind === "audio"
    );
    const hasVideo = transceivers.some(
      (t) => t.sender.track?.kind === "video" || t.receiver.track?.kind === "video"
    );
    if (!hasAudio) this.pc.addTransceiver("audio", { direction: "recvonly" });
    if (!hasVideo) this.pc.addTransceiver("video", { direction: "recvonly" });
  }
  async handleRemoteOffer(sdp, localStream) {
    if (this.disposed) throw new Error("PeerConnectionManager is disposed");
    if (this.pc.connectionState === "closed" || this.pc.signalingState === "closed") {
      throw new Error("Peer connection is closed");
    }
    const offerSdp = prepareRemoteOfferSdp(sdp, this.options.sdpSanitization);
    if (!offerSdp.startsWith("v=")) {
      throw new Error("Received invalid offer SDP");
    }
    logSdpAnalysis(offerSdp, "Remote Offer");
    const sessionOnly = !offerSdp.includes("m=");
    if (!sessionOnly) {
      const offerValidation = validateRoomModeSdp(offerSdp, "offer");
      if (!offerValidation.valid) {
        throw new Error(
          `Server offer failed validation: ${offerValidation.critical.join(", ")}`
        );
      }
    }
    const offerInfo = describeSdp(offerSdp);
    if (!sessionOnly && !offerInfo.hasFingerprint && !offerInfo.hasSetup && !offerInfo.hasIceUfrag) {
      throw new Error(
        "Server offer is missing DTLS/ICE attributes \u2014 cannot negotiate WebRTC"
      );
    }
    signalingLog("handling offer", {
      sessionOnly,
      isRenegotiation: Boolean(this.pc.currentRemoteDescription),
      hasLocalStream: Boolean(localStream),
      signalingState: this.pc.signalingState,
      transceivers: this.pc.getTransceivers().length,
      offer: offerInfo
    });
    const isRenegotiation = Boolean(this.pc.currentRemoteDescription);
    return new Promise((resolve, reject) => {
      const previous = this.offerChain.catch(() => {
      });
      const next = previous.then(async () => {
        await this.rollbackIfNeeded();
        if (!sessionOnly && isRenegotiation && localStream) {
          this.syncLocalSenders(localStream);
        }
        if (!sessionOnly && !isRenegotiation && !localStream) {
          this.ensureRecvTransceivers();
        }
        try {
          await setRemoteOfferDescription(
            this.pc,
            sdp,
            this.options.sdpSanitization
          );
        } catch (err) {
          if (sessionOnly) {
            signalingLog(
              "browser rejected session-only offer \u2014 waiting for renegotiation with media"
            );
            resolve(null);
            return;
          }
          throw err;
        }
        signalingLog("remote description set", {
          signalingState: this.pc.signalingState,
          transceivers: this.pc.getTransceivers().length
        });
        if (this.pc.signalingState !== "have-remote-offer") {
          throw new Error(
            `Cannot create answer in signalingState=${this.pc.signalingState}`
          );
        }
        await Promise.resolve(
          this.callbacks.onBeforeCreateAnswer?.(this.pc, isRenegotiation)
        );
        if (localStream) {
          this.attachLocalTracks(localStream);
          this.ensureSendRecvForLocalSenders(localStream);
        }
        let answer = await this.pc.createAnswer();
        if (sessionOnly) {
          await this.pc.setLocalDescription(answer);
          const localSdp2 = this.pc.localDescription?.sdp ?? answer.sdp ?? null;
          if (localSdp2) {
            await this.flushPendingCandidates();
            this.callbacks.onNegotiationComplete?.();
            resolve(normalizeSdpText(localSdp2));
          } else {
            resolve(null);
          }
          return;
        }
        let answerInfo = describeSdp(answer.sdp);
        if (localStream && (!answerInfo.hasIceUfrag || this.answerNeedsSendRecvRetry(answer.sdp, localStream))) {
          signalingLog("retrying createAnswer with sendrecv transceivers", {
            hasIceUfrag: answerInfo.hasIceUfrag,
            hasSendrecv: answerInfo.hasSendrecv,
            hasRecvonly: answerInfo.hasRecvonly
          });
          for (const track of localStream.getTracks()) {
            if (track.readyState === "ended") continue;
            const existing = this.pc.getTransceivers().find(
              (transceiver) => !mediaDeviceManager.isStageRecordingSender(
                this.pc,
                transceiver.sender
              ) && transceiver.sender.track?.kind === track.kind
            );
            if (existing) {
              await existing.sender.replaceTrack(track);
              existing.direction = "sendrecv";
            } else {
              const sender = mediaDeviceManager.findSenderForKind(
                this.pc,
                track.kind
              );
              if (sender) {
                await sender.replaceTrack(track);
                const transceiver = this.pc.getTransceivers().find((item) => item.sender === sender);
                if (transceiver) {
                  transceiver.direction = "sendrecv";
                }
              } else {
                this.pc.addTransceiver(track, {
                  direction: "sendrecv",
                  streams: [localStream]
                });
              }
            }
          }
          this.ensureSendRecvForLocalSenders(localStream);
          answer = await this.pc.createAnswer();
          answerInfo = describeSdp(answer.sdp);
        }
        await this.pc.setLocalDescription(answer);
        if (this.options.waitForIceGathering) {
          await waitForIceGathering(
            this.pc,
            isRenegotiation ? 250 : this.options.iceGatheringTimeoutMs
          );
        }
        if (localStream) {
          void this.applyVideoQualityTier(DEFAULT_VIDEO_QUALITY_TIER);
        }
        const localSdp = this.pc.localDescription?.sdp ?? answer.sdp ?? null;
        if (!localSdp) {
          throw new Error("No answer SDP was generated");
        }
        const validationError = validateAnswerSdp(
          localSdp,
          this.options.answerValidation,
          this.pc.getTransceivers().length
        );
        if (validationError) {
          throw new Error(validationError);
        }
        const finalAnswerInfo = describeSdp(localSdp);
        const hasLiveLocalTrack = Boolean(
          localStream?.getTracks().some((track) => track.readyState === "live")
        );
        if (hasLiveLocalTrack && finalAnswerInfo.hasRecvonly && !finalAnswerInfo.hasSendrecv) {
          signalingWarn("publish blocked: recvonly answer", {
            isRenegotiation,
            signalingState: this.pc.signalingState
          });
        }
        logSdpAnalysis(localSdp, "Generated Answer", "answer");
        await this.flushPendingCandidates();
        this.callbacks.onNegotiationComplete?.();
        resolve(normalizeSdpText(localSdp));
      });
      next.catch(reject);
      this.offerChain = next.then(
        () => {
        },
        () => {
        }
      );
    });
  }
  async handleRemoteCandidate(candidateJson) {
    const parsed = parseIceCandidateInit(candidateJson);
    if (!parsed) {
      signalingWarn("ignored invalid ICE candidate payload");
      return;
    }
    if (this.pendingCandidates.length >= this.options.maxPendingIceCandidates) {
      signalingWarn("ICE candidate queue full \u2014 dropping candidate");
      return;
    }
    if (!this.isReadyForIce()) {
      this.pendingCandidates.push(parsed);
      signalingLog(
        "queued remote ICE candidate until local+remote descriptions are set"
      );
      return;
    }
    try {
      await this.pc.addIceCandidate(parsed);
    } catch (error) {
      signalingWarn("addIceCandidate failed", error);
    }
  }
  startStatsPolling() {
    if (!this.callbacks.onStatsUpdate) return;
    this.statsCollector.start(this.pc, this.callbacks.onStatsUpdate);
  }
  stopStatsPolling() {
    this.statsCollector.stop();
  }
  close() {
    this.disposed = true;
    this.iceRestartHandler.dispose();
    this.statsCollector.stop();
    this.pendingCandidates = [];
    this.offerChain = Promise.resolve();
    this.pc.close();
  }
  syncLocalSenders(localStream) {
    for (const track of localStream.getTracks()) {
      if (track.readyState === "ended") continue;
      const sender = this.pc.getSenders().find(
        (item) => item.track?.kind === track.kind && !mediaDeviceManager.isStageRecordingSender(this.pc, item)
      );
      if (sender) {
        void sender.replaceTrack(track);
      }
    }
  }
  ensureSendRecvForLocalSenders(localStream) {
    if (!localStream) return;
    const localKinds = new Set(
      localStream.getTracks().filter((track) => track.readyState !== "ended").map((track) => track.kind)
    );
    for (const transceiver of this.pc.getTransceivers()) {
      if (mediaDeviceManager.isStageRecordingSender(this.pc, transceiver.sender)) {
        continue;
      }
      if (transceiver.sender.track && localKinds.has(transceiver.sender.track.kind)) {
        if (transceiver.direction === "recvonly" || transceiver.direction === "inactive") {
          transceiver.direction = "sendrecv";
        }
      }
    }
  }
  answerNeedsSendRecvRetry(answerSdp, localStream) {
    if (!localStream || !answerSdp) return false;
    const hasLiveLocalTrack = localStream.getTracks().some((track) => track.readyState === "live");
    if (!hasLiveLocalTrack) return false;
    const info = describeSdp(answerSdp);
    return !info.hasSendrecv && info.hasRecvonly;
  }
  configureVideoSender(sender, track) {
    if (this.options.simulcast) {
      this.configureSimulcast(sender);
      return;
    }
    this.applyVideoQualityTier(this.currentVideoTier, track);
  }
  configureSimulcast(sender, layers = SIMULCAST_LAYERS) {
    try {
      const params = sender.getParameters();
      params.encodings = layers.map((layer) => ({
        rid: layer.rid,
        maxBitrate: layer.maxBitrate,
        scaleResolutionDownBy: layer.scaleResolutionDownBy,
        active: true
      }));
      void sender.setParameters(params);
    } catch {
    }
  }
  attachEventHandlers() {
    this.pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.callbacks.onIceCandidate(event.candidate);
      }
    };
    this.pc.onicegatheringstatechange = () => {
      signalingLog("ICE gathering state", this.pc.iceGatheringState);
    };
    this.pc.oniceconnectionstatechange = () => {
      const state = this.pc.iceConnectionState;
      signalingLog("ICE connection state", state);
      this.callbacks.onIceConnectionStateChange?.(state);
      switch (state) {
        case "connected":
        case "completed":
          this.iceRestartHandler.reset();
          break;
        case "failed":
          this.callbacks.onIceFailure();
          break;
        case "disconnected":
          signalingLog("ICE disconnected \u2014 monitoring for recovery");
          break;
      }
    };
    this.pc.onconnectionstatechange = () => {
      signalingLog("connection state", this.pc.connectionState);
      this.callbacks.onConnectionStateChange(this.pc.connectionState);
    };
    this.pc.ontrack = (event) => {
      if (event.track.readyState === "ended") return;
      signalingLog("remote track received", {
        kind: event.track.kind,
        streamCount: event.streams.length,
        streamId: event.streams[0]?.id
      });
      this.callbacks.onTrack(event.track, event.streams);
    };
  }
  isReadyForIce() {
    return Boolean(this.pc.remoteDescription && this.pc.localDescription);
  }
  async flushPendingCandidates() {
    if (!this.isReadyForIce()) return;
    const queued = this.pendingCandidates;
    this.pendingCandidates = [];
    for (const candidate of queued) {
      try {
        await this.pc.addIceCandidate(candidate);
      } catch (error) {
        signalingWarn("flushPendingCandidates failed", error);
      }
    }
  }
  async rollbackIfNeeded() {
    if (this.pc.signalingState !== "have-local-offer") return;
    try {
      await this.pc.setLocalDescription({ type: "rollback" });
    } catch {
    }
  }
  async prepareMediaBeforeAnswer(localStream) {
    if (localStream) {
      this.attachLocalTracks(localStream);
      return;
    }
    this.ensureRecvTransceivers();
  }
};

export {
  ROOM_PEER_CONNECTION_OPTIONS,
  PeerConnectionManager
};
//# sourceMappingURL=chunk-LQG3EZ37.js.map