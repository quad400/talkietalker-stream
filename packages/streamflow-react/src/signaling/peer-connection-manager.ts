import {
  signalingLog,
  signalingWarn,
  normalizeSdp,
  logSdpAnalysis,
  sanitizeSdpSafe,
  normalizeSdpText,
  parseIceCandidateInit,
  validateRoomModeSdp,
} from "./helpers"
import { mediaDeviceManager } from "./media-device-manager"
import { IceRestartHandler } from "./ice-restart-handler"
import { StatsCollector } from "./stats-collector"
import type { ConnectionQuality, ParsedStats, SimulcastLayer } from "./types"
import { DEFAULT_RTC_CONFIG, SIMULCAST_LAYERS } from "./types"
import {
  DEFAULT_VIDEO_QUALITY_TIER,
  getVideoQualityProfile,
  isCameraVideoTrack,
  isScreenShareVideoTrack,
  SCREEN_SHARE_ENCODING,
  type VideoQualityTier,
} from "./video-quality"

export interface PeerConnectionCallbacks {
  onIceCandidate: (candidate: RTCIceCandidate) => void
  onTrack: (track: MediaStreamTrack, streams: readonly MediaStream[]) => void
  onConnectionStateChange: (state: RTCPeerConnectionState) => void
  onIceConnectionStateChange?: (state: RTCIceConnectionState) => void
  onIceFailure: () => void
  onNegotiationComplete?: () => void
  onBeforeCreateAnswer?: (
    pc: RTCPeerConnection,
    isRenegotiation: boolean,
  ) => void | Promise<void>
  onStatsUpdate?: (stats: ParsedStats, quality: ConnectionQuality) => void
}

export type SdpSanitizationMode = "none" | "safe" | "legacy"
export type AnswerValidationMode = "off" | "warn" | "strict"

export interface PeerConnectionOptions {
  simulcast?: boolean
  /** @deprecated Use sdpSanitization instead */
  sanitizeOfferSdp?: boolean
  sdpSanitization?: SdpSanitizationMode
  waitForIceGathering?: boolean
  iceGatheringTimeoutMs?: number
  /** @deprecated Use answerValidation instead */
  strictAnswerValidation?: boolean
  answerValidation?: AnswerValidationMode
  maxPendingIceCandidates?: number
}

interface ResolvedPeerConnectionOptions {
  simulcast: boolean
  sdpSanitization: SdpSanitizationMode
  waitForIceGathering: boolean
  iceGatheringTimeoutMs: number
  answerValidation: AnswerValidationMode
  maxPendingIceCandidates: number
}

const DEFAULT_PEER_CONNECTION_OPTIONS: ResolvedPeerConnectionOptions = {
  simulcast: false,
  sdpSanitization: "legacy",
  waitForIceGathering: true,
  iceGatheringTimeoutMs: 5_000,
  answerValidation: "strict",
  maxPendingIceCandidates: 256,
}

/**
 * Production room defaults: safe SDP normalization, short ICE gather window,
 * validation warnings only (never blocks a working negotiation).
 */
export const ROOM_PEER_CONNECTION_OPTIONS: PeerConnectionOptions = {
  simulcast: false,
  sdpSanitization: "safe",
  waitForIceGathering: false,
  iceGatheringTimeoutMs: 500,
  answerValidation: "warn",
  maxPendingIceCandidates: 512,
}

interface SdpInfo {
  hasIceUfrag: boolean
  hasIcePwd: boolean
  hasFingerprint: boolean
  hasSetup: boolean
  mediaLines: number
  lineCount: number
  hasSendrecv: boolean
  hasRecvonly: boolean
  hasSendonly: boolean
}

const SESSION_ATTRS_REQUIRING_MEDIA = new Set([
  "extmap-allow-mixed",
  "rtpmap",
  "fmtp",
  "rtcp-fb",
  "extmap",
])

function resolveOptions(
  options?: PeerConnectionOptions,
): ResolvedPeerConnectionOptions {
  const merged = { ...DEFAULT_PEER_CONNECTION_OPTIONS, ...options }

  if (options?.sanitizeOfferSdp !== undefined && !options.sdpSanitization) {
    merged.sdpSanitization = options.sanitizeOfferSdp ? "legacy" : "none"
  }

  if (
    options?.strictAnswerValidation !== undefined &&
    !options.answerValidation
  ) {
    merged.answerValidation = options.strictAnswerValidation ? "strict" : "off"
  }

  return merged
}

function describeSdp(sdp?: string | null): SdpInfo {
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
      hasSendonly: false,
    }
  }
  const lines = sdp
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)

  return {
    hasIceUfrag: lines.some((l) => l.startsWith("a=ice-ufrag:")),
    hasIcePwd: lines.some((l) => l.startsWith("a=ice-pwd:")),
    hasFingerprint: lines.some((l) => l.startsWith("a=fingerprint:")),
    hasSetup: lines.some((l) => l.startsWith("a=setup:")),
    mediaLines: lines.filter((l) => l.startsWith("m=")).length,
    lineCount: lines.length,
    hasSendrecv: lines.some((l) => l.includes("a=sendrecv")),
    hasRecvonly: lines.some((l) => l.includes("a=recvonly")),
    hasSendonly: lines.some((l) => l.includes("a=sendonly")),
  }
}

function sanitizeRemoteOfferSdpLegacy(sdp: string): string {
  const normalized = normalizeSdpText(sdp).replace(/\r\n/g, "\n").trim()
  const lines = normalized.split("\n")
  const firstMediaIndex = lines.findIndex((l) => l.trim().startsWith("m="))

  const sanitized = lines.filter((line, index) => {
    const trimmed = line.trim()
    if (firstMediaIndex !== -1 && index >= firstMediaIndex) return true
    if (!trimmed.startsWith("a=")) return true

    const attr = trimmed.slice(2).split(":")[0]?.trim()
    if (attr === "extmap-allow-mixed") return false
    if (firstMediaIndex === -1 && SESSION_ATTRS_REQUIRING_MEDIA.has(attr ?? "")) {
      return false
    }

    return true
  })

  return `${sanitized.join("\r\n")}\r\n`
}

function prepareRemoteOfferSdp(
  sdp: string,
  mode: SdpSanitizationMode,
): string {
  const raw = normalizeSdp(sdp) ?? sdp

  switch (mode) {
    case "none":
      return normalizeSdpText(raw)
    case "safe":
      return sanitizeSdpSafe(raw)
    case "legacy":
      return sanitizeRemoteOfferSdpLegacy(raw)
  }
}

async function setRemoteOfferDescription(
  pc: RTCPeerConnection,
  sdp: string,
  mode: SdpSanitizationMode,
): Promise<void> {
  const prepared = prepareRemoteOfferSdp(sdp, mode)

  try {
    await pc.setRemoteDescription({ type: "offer", sdp: prepared })
    return
  } catch (firstError) {
    if (mode === "none") throw firstError

    signalingWarn("setRemoteDescription failed with prepared SDP, retrying raw", {
      mode,
      error: firstError,
    })

    const fallback = normalizeSdpText(sdp)
    try {
      await pc.setRemoteDescription({ type: "offer", sdp: fallback })
      return
    } catch {
      // Last resort: pass through exactly as received (matches docs/room.html)
      await pc.setRemoteDescription({ type: "offer", sdp })
    }
  }
}

function waitForIceGathering(
  pc: RTCPeerConnection,
  timeoutMs: number,
): Promise<void> {
  if (pc.iceGatheringState === "complete") return Promise.resolve()

  return new Promise<void>((resolve) => {
    const timeout = window.setTimeout(() => {
      pc.removeEventListener("icegatheringstatechange", onChange)
      signalingLog("ICE gathering timeout — sending answer with trickle ICE")
      resolve()
    }, timeoutMs)

    function onChange() {
      if (pc.iceGatheringState === "complete") {
        window.clearTimeout(timeout)
        pc.removeEventListener("icegatheringstatechange", onChange)
        resolve()
      }
    }

    pc.addEventListener("icegatheringstatechange", onChange)
  })
}

function validateAnswerSdp(
  sdp: string,
  mode: AnswerValidationMode,
  transceiverCount: number,
): string | null {
  if (mode === "off") return null

  const info = describeSdp(sdp)
  const roomCheck = validateRoomModeSdp(sdp, "answer")
  const issues: string[] = []

  if (!info.hasIceUfrag || !info.hasFingerprint) {
    issues.push("answer missing ICE/DTLS attributes")
  }
  if (info.mediaLines === 0) {
    issues.push(
      `answer missing media sections (transceivers=${transceiverCount})`,
    )
  }

  for (const issue of [...roomCheck.critical, ...issues]) {
    if (mode === "strict") {
      return issue
    }
    signalingWarn(`answer validation: ${issue}`)
  }

  return null
}

export class PeerConnectionManager {
  private pc: RTCPeerConnection
  private callbacks: PeerConnectionCallbacks
  private options: ResolvedPeerConnectionOptions
  private offerChain = Promise.resolve()
  private pendingCandidates: RTCIceCandidateInit[] = []
  private iceRestartHandler = new IceRestartHandler()
  private statsCollector = new StatsCollector()
  private disposed = false
  private currentVideoTier: VideoQualityTier = DEFAULT_VIDEO_QUALITY_TIER

  constructor(
    callbacks: PeerConnectionCallbacks,
    config?: RTCConfiguration,
    options?: PeerConnectionOptions,
  ) {
    this.callbacks = callbacks
    this.options = resolveOptions(options)
    this.pc = new RTCPeerConnection(config ?? DEFAULT_RTC_CONFIG)
    this.attachEventHandlers()
  }

  get connection(): RTCPeerConnection {
    return this.pc
  }

  get connectionState(): RTCPeerConnectionState {
    return this.pc.connectionState
  }

  get iceConnectionState(): RTCIceConnectionState {
    return this.pc.iceConnectionState
  }

  get videoQualityTier(): VideoQualityTier {
    return this.currentVideoTier
  }

  async applyVideoQualityTier(
    tier: VideoQualityTier,
    track?: MediaStreamTrack | null,
  ): Promise<boolean> {
    const sender = this.findPrimaryVideoSender()
    if (!sender?.track || sender.track.readyState === "ended") return false

    const videoTrack = track ?? sender.track
    if (!isCameraVideoTrack(videoTrack)) return false

    const profile = getVideoQualityProfile(tier)

    try {
      await videoTrack.applyConstraints(profile.captureConstraints).catch(() => undefined)

      if ("contentHint" in videoTrack) {
        videoTrack.contentHint = "motion"
      }

      const encodingApplied = await this.applyEncodingParams(
        sender,
        profile.encodingParams,
        "maintain-resolution",
      )
      if (!encodingApplied) {
        signalingLog("video quality encoding deferred until sender is negotiated", {
          tier,
        })
        return false
      }

      this.currentVideoTier = tier
      signalingLog("video quality tier applied", {
        tier,
        label: profile.label,
      })
      return true
    } catch (error) {
      const detail =
        error instanceof DOMException
          ? `${error.name}: ${error.message}`
          : error instanceof Error
            ? error.message
            : String(error)
      signalingWarn("video quality tier apply failed", { tier, error: detail })
      return false
    }
  }

  async configureScreenShareSender(track?: MediaStreamTrack | null): Promise<boolean> {
    const sender = this.findPrimaryVideoSender()
    if (!sender?.track || sender.track.readyState === "ended") return false

    const videoTrack = track ?? sender.track
    if (!isScreenShareVideoTrack(videoTrack)) return false

    try {
      if ("contentHint" in videoTrack) {
        try {
          videoTrack.contentHint = SCREEN_SHARE_ENCODING.contentHint
        } catch {
          videoTrack.contentHint = "text"
        }
      }

      const encodingApplied = await this.applyEncodingParams(
        sender,
        {
          maxBitrate: SCREEN_SHARE_ENCODING.maxBitrate,
          maxFramerate: SCREEN_SHARE_ENCODING.maxFramerate,
          scaleResolutionDownBy: SCREEN_SHARE_ENCODING.scaleResolutionDownBy,
        },
        "maintain-resolution",
      )
      if (!encodingApplied) return false

      signalingLog("screen share encoding applied")
      return true
    } catch (error) {
      signalingWarn("screen share encoding apply failed", { error })
      return false
    }
  }

  private findPrimaryVideoSender(): RTCRtpSender | undefined {
    return this.pc.getSenders().find(
      (item) =>
        item.track?.kind === "video" &&
        !mediaDeviceManager.isStageRecordingSender(this.pc, item),
    )
  }

  private async applyEncodingParams(
    sender: RTCRtpSender,
    encoding: {
      maxBitrate: number
      maxFramerate: number
      scaleResolutionDownBy: number
    },
    degradationPreference: RTCDegradationPreference,
  ): Promise<boolean> {
    const params = sender.getParameters()
    if (!params.encodings?.length) {
      return false
    }

    params.degradationPreference = degradationPreference
    params.encodings = [
      {
        ...(params.encodings[0] ?? {}),
        active: true,
        maxBitrate: encoding.maxBitrate,
        maxFramerate: encoding.maxFramerate,
        scaleResolutionDownBy: encoding.scaleResolutionDownBy,
      },
    ]

    try {
      await sender.setParameters(params)
      return true
    } catch (error) {
      if (degradationPreference !== "balanced") {
        return this.applyEncodingParams(sender, encoding, "balanced")
      }
      throw error
    }
  }

  attachLocalTracks(localStream: MediaStream): void {
    for (const track of localStream.getTracks()) {
      if (track.readyState === "ended") continue

      const existing =
        this.pc
          .getSenders()
          .find(
            (sender) =>
              sender.track?.kind === track.kind &&
              !mediaDeviceManager.isStageRecordingSender(this.pc, sender),
          ) ??
        this.pc
          .getTransceivers()
          .find(
            (transceiver) =>
              !mediaDeviceManager.isStageRecordingSender(
                this.pc,
                transceiver.sender,
              ) &&
              (transceiver.sender.track?.kind === track.kind ||
                transceiver.receiver.track?.kind === track.kind),
          )?.sender

      if (existing) {
        void existing.replaceTrack(track).then(() => {
          if (track.kind === "video") {
            this.configureVideoSender(existing, track)
          }
        })
      } else {
        const sender = this.pc.addTrack(track, localStream)
        if (track.kind === "video") {
          this.configureVideoSender(sender, track)
        }
      }
    }
  }

  ensureRecvTransceivers(): void {
    const transceivers = this.pc.getTransceivers()
    const hasAudio = transceivers.some(
      (t) =>
        t.sender.track?.kind === "audio" ||
        t.receiver.track?.kind === "audio",
    )
    const hasVideo = transceivers.some(
      (t) =>
        t.sender.track?.kind === "video" ||
        t.receiver.track?.kind === "video",
    )

    if (!hasAudio) this.pc.addTransceiver("audio", { direction: "recvonly" })
    if (!hasVideo) this.pc.addTransceiver("video", { direction: "recvonly" })
  }

  async handleRemoteOffer(
    sdp: string,
    localStream?: MediaStream | null,
  ): Promise<string | null> {
    if (this.disposed) throw new Error("PeerConnectionManager is disposed")
    if (
      this.pc.connectionState === "closed" ||
      this.pc.signalingState === "closed"
    ) {
      throw new Error("Peer connection is closed")
    }

    const offerSdp = prepareRemoteOfferSdp(sdp, this.options.sdpSanitization)
    if (!offerSdp.startsWith("v=")) {
      throw new Error("Received invalid offer SDP")
    }

    logSdpAnalysis(offerSdp, "Remote Offer")

    const sessionOnly = !offerSdp.includes("m=")

    if (!sessionOnly) {
      const offerValidation = validateRoomModeSdp(offerSdp, "offer")
      if (!offerValidation.valid) {
        throw new Error(
          `Server offer failed validation: ${offerValidation.critical.join(", ")}`,
        )
      }
    }

    const offerInfo = describeSdp(offerSdp)

    if (
      !sessionOnly &&
      !offerInfo.hasFingerprint &&
      !offerInfo.hasSetup &&
      !offerInfo.hasIceUfrag
    ) {
      throw new Error(
        "Server offer is missing DTLS/ICE attributes — cannot negotiate WebRTC",
      )
    }

    signalingLog("handling offer", {
      sessionOnly,
      isRenegotiation: Boolean(this.pc.currentRemoteDescription),
      hasLocalStream: Boolean(localStream),
      signalingState: this.pc.signalingState,
      transceivers: this.pc.getTransceivers().length,
      offer: offerInfo,
    })

    const isRenegotiation = Boolean(this.pc.currentRemoteDescription)

    return new Promise<string | null>((resolve, reject) => {
      const previous = this.offerChain.catch(() => {})

      const next = previous.then(async () => {
        await this.rollbackIfNeeded()

        // For renegotiation only: sync existing senders with updated local stream
        // Do NOT call attachLocalTracks before setRemoteDescription — tracks must
        // be assigned to transceivers that the SFU's offer has already defined.
        // Adding tracks before setRemoteDescription creates orphan senders with no
        // mid binding, which causes the browser to answer recvonly/inactive and
        // the outbound stream appears blank on the far end.
        if (!sessionOnly && isRenegotiation && localStream) {
          this.syncLocalSenders(localStream)
        }

        // If no local stream and no transceivers exist yet, ensure recvonly stubs
        // so the browser can accept the offer (viewer-only path).
        if (!sessionOnly && !isRenegotiation && !localStream) {
          this.ensureRecvTransceivers()
        }

        try {
          await setRemoteOfferDescription(
            this.pc,
            sdp,
            this.options.sdpSanitization,
          )
        } catch (err) {
          if (sessionOnly) {
            signalingLog(
              "browser rejected session-only offer — waiting for renegotiation with media",
            )
            resolve(null)
            return
          }
          throw err
        }

        signalingLog("remote description set", {
          signalingState: this.pc.signalingState,
          transceivers: this.pc.getTransceivers().length,
        })

        if (this.pc.signalingState !== "have-remote-offer") {
          throw new Error(
            `Cannot create answer in signalingState=${this.pc.signalingState}`,
          )
        }

        await Promise.resolve(
          this.callbacks.onBeforeCreateAnswer?.(this.pc, isRenegotiation),
        )

        // Attach local tracks after setRemoteDescription on every negotiation so
        // renegotiation offers (peer join/leave) keep outbound sendrecv.
        if (localStream) {
          this.attachLocalTracks(localStream)
          this.ensureSendRecvForLocalSenders(localStream)
        }

        let answer = await this.pc.createAnswer()

        if (sessionOnly) {
          await this.pc.setLocalDescription(answer)
          const localSdp =
            this.pc.localDescription?.sdp ?? answer.sdp ?? null
          if (localSdp) {
            await this.flushPendingCandidates()
            this.callbacks.onNegotiationComplete?.()
            resolve(normalizeSdpText(localSdp))
          } else {
            resolve(null)
          }
          return
        }

        let answerInfo = describeSdp(answer.sdp)

        if (
          localStream &&
          (!answerInfo.hasIceUfrag ||
            this.answerNeedsSendRecvRetry(answer.sdp, localStream))
        ) {
          signalingLog("retrying createAnswer with sendrecv transceivers", {
            hasIceUfrag: answerInfo.hasIceUfrag,
            hasSendrecv: answerInfo.hasSendrecv,
            hasRecvonly: answerInfo.hasRecvonly,
          })
          for (const track of localStream.getTracks()) {
            if (track.readyState === "ended") continue

            const existing = this.pc
              .getTransceivers()
              .find(
                (transceiver) =>
                  !mediaDeviceManager.isStageRecordingSender(
                    this.pc,
                    transceiver.sender,
                  ) && transceiver.sender.track?.kind === track.kind,
              )

            if (existing) {
              await existing.sender.replaceTrack(track)
              existing.direction = "sendrecv"
            } else {
              const sender = mediaDeviceManager.findSenderForKind(
                this.pc,
                track.kind,
              )
              if (sender) {
                await sender.replaceTrack(track)
                const transceiver = this.pc
                  .getTransceivers()
                  .find((item) => item.sender === sender)
                if (transceiver) {
                  transceiver.direction = "sendrecv"
                }
              } else {
                this.pc.addTransceiver(track, {
                  direction: "sendrecv",
                  streams: [localStream],
                })
              }
            }
          }
          this.ensureSendRecvForLocalSenders(localStream)
          answer = await this.pc.createAnswer()
          answerInfo = describeSdp(answer.sdp)
        }

        await this.pc.setLocalDescription(answer)
        if (this.options.waitForIceGathering) {
          await waitForIceGathering(
            this.pc,
            isRenegotiation ? 250 : this.options.iceGatheringTimeoutMs,
          )
        }
        if (localStream) {
          void this.applyVideoQualityTier(DEFAULT_VIDEO_QUALITY_TIER)
        }

        const localSdp =
          this.pc.localDescription?.sdp ?? answer.sdp ?? null

        if (!localSdp) {
          throw new Error("No answer SDP was generated")
        }

        const validationError = validateAnswerSdp(
          localSdp,
          this.options.answerValidation,
          this.pc.getTransceivers().length,
        )
        if (validationError) {
          throw new Error(validationError)
        }

        const finalAnswerInfo = describeSdp(localSdp)
        const hasLiveLocalTrack = Boolean(
          localStream?.getTracks().some((track) => track.readyState === "live"),
        )
        if (
          hasLiveLocalTrack &&
          finalAnswerInfo.hasRecvonly &&
          !finalAnswerInfo.hasSendrecv
        ) {
          signalingWarn("publish blocked: recvonly answer", {
            isRenegotiation,
            signalingState: this.pc.signalingState,
          })
        }

        logSdpAnalysis(localSdp, "Generated Answer", "answer")
        await this.flushPendingCandidates()
        this.callbacks.onNegotiationComplete?.()
        resolve(normalizeSdpText(localSdp))
      })

      next.catch(reject)
      this.offerChain = next.then(
        () => {},
        () => {},
      )
    })
  }

  async handleRemoteCandidate(candidateJson: string): Promise<void> {
    const parsed = parseIceCandidateInit(candidateJson)
    if (!parsed) {
      signalingWarn("ignored invalid ICE candidate payload")
      return
    }

    if (this.pendingCandidates.length >= this.options.maxPendingIceCandidates) {
      signalingWarn("ICE candidate queue full — dropping candidate")
      return
    }

    if (!this.isReadyForIce()) {
      this.pendingCandidates.push(parsed)
      signalingLog(
        "queued remote ICE candidate until local+remote descriptions are set",
      )
      return
    }

    try {
      await this.pc.addIceCandidate(parsed)
    } catch (error) {
      signalingWarn("addIceCandidate failed", error)
    }
  }

  startStatsPolling(): void {
    if (!this.callbacks.onStatsUpdate) return
    this.statsCollector.start(this.pc, this.callbacks.onStatsUpdate)
  }

  stopStatsPolling(): void {
    this.statsCollector.stop()
  }

  close(): void {
    this.disposed = true
    this.iceRestartHandler.dispose()
    this.statsCollector.stop()
    this.pendingCandidates = []
    this.offerChain = Promise.resolve()
    this.pc.close()
  }

  private syncLocalSenders(localStream: MediaStream): void {
    for (const track of localStream.getTracks()) {
      if (track.readyState === "ended") continue

      const sender = this.pc
        .getSenders()
        .find(
          (item) =>
            item.track?.kind === track.kind &&
            !mediaDeviceManager.isStageRecordingSender(this.pc, item),
        )

      if (sender) {
        void sender.replaceTrack(track)
      }
    }
  }

  private ensureSendRecvForLocalSenders(localStream?: MediaStream | null): void {
    if (!localStream) return

    const localKinds = new Set(
      localStream
        .getTracks()
        .filter((track) => track.readyState !== "ended")
        .map((track) => track.kind),
    )

    for (const transceiver of this.pc.getTransceivers()) {
      if (
        mediaDeviceManager.isStageRecordingSender(this.pc, transceiver.sender)
      ) {
        continue
      }
      if (transceiver.sender.track && localKinds.has(transceiver.sender.track.kind)) {
        if (
          transceiver.direction === "recvonly" ||
          transceiver.direction === "inactive"
        ) {
          transceiver.direction = "sendrecv"
        }
      }
    }
  }

  private answerNeedsSendRecvRetry(
    answerSdp: string | undefined,
    localStream?: MediaStream | null,
  ): boolean {
    if (!localStream || !answerSdp) return false

    const hasLiveLocalTrack = localStream
      .getTracks()
      .some((track) => track.readyState === "live")
    if (!hasLiveLocalTrack) return false

    const info = describeSdp(answerSdp)
    // SFU answers may mix recvonly (inbound) + sendrecv (outbound) — only retry when we send nothing
    return !info.hasSendrecv && info.hasRecvonly
  }

  private configureVideoSender(
    sender: RTCRtpSender,
    track: MediaStreamTrack,
  ): void {
    if (this.options.simulcast) {
      this.configureSimulcast(sender)
      return
    }

    this.applyVideoQualityTier(this.currentVideoTier, track)
  }

  private configureSimulcast(
    sender: RTCRtpSender,
    layers: SimulcastLayer[] = SIMULCAST_LAYERS,
  ): void {
    try {
      const params = sender.getParameters()
      params.encodings = layers.map((layer) => ({
        rid: layer.rid,
        maxBitrate: layer.maxBitrate,
        scaleResolutionDownBy: layer.scaleResolutionDownBy,
        active: true,
      }))
      void sender.setParameters(params)
    } catch {
      // Simulcast not supported or params not settable — non-fatal
    }
  }

  private attachEventHandlers(): void {
    this.pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.callbacks.onIceCandidate(event.candidate)
      }
    }

    this.pc.onicegatheringstatechange = () => {
      signalingLog("ICE gathering state", this.pc.iceGatheringState)
    }

    this.pc.oniceconnectionstatechange = () => {
      const state = this.pc.iceConnectionState
      signalingLog("ICE connection state", state)
      this.callbacks.onIceConnectionStateChange?.(state)

      switch (state) {
        case "connected":
        case "completed":
          this.iceRestartHandler.reset()
          break
        case "failed":
          this.callbacks.onIceFailure()
          break
        case "disconnected":
          signalingLog("ICE disconnected — monitoring for recovery")
          break
      }
    }

    this.pc.onconnectionstatechange = () => {
      signalingLog("connection state", this.pc.connectionState)
      this.callbacks.onConnectionStateChange(this.pc.connectionState)
    }

    this.pc.ontrack = (event) => {
      if (event.track.readyState === "ended") return

      signalingLog("remote track received", {
        kind: event.track.kind,
        streamCount: event.streams.length,
        streamId: event.streams[0]?.id,
      })

      this.callbacks.onTrack(event.track, event.streams)
    }
  }

  private isReadyForIce(): boolean {
    return Boolean(this.pc.remoteDescription && this.pc.localDescription)
  }

  private async flushPendingCandidates(): Promise<void> {
    if (!this.isReadyForIce()) return

    const queued = this.pendingCandidates
    this.pendingCandidates = []

    for (const candidate of queued) {
      try {
        await this.pc.addIceCandidate(candidate)
      } catch (error) {
        signalingWarn("flushPendingCandidates failed", error)
      }
    }
  }

  private async rollbackIfNeeded(): Promise<void> {
    if (this.pc.signalingState !== "have-local-offer") return
    try {
      await this.pc.setLocalDescription({ type: "rollback" })
    } catch {
      // Rollback may not be supported in all browsers
    }
  }

  private async prepareMediaBeforeAnswer(
    localStream?: MediaStream | null,
  ): Promise<void> {
    if (localStream) {
      this.attachLocalTracks(localStream)
      return
    }
    this.ensureRecvTransceivers()
  }
}