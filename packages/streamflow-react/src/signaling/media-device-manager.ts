import { signalingLog, signalingWarn } from "./helpers"
import { DEFAULT_CAMERA_VIDEO_CONSTRAINTS } from "./video-quality"

export const STAGE_RECORDING_STREAM_ID = "__streamflow_stage_recording__"

const DEFAULT_AUDIO_CONSTRAINTS: MediaTrackConstraints = {
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
  sampleRate: 48000,
  channelCount: 1,
}

const DEFAULT_VIDEO_CONSTRAINTS: MediaTrackConstraints =
  DEFAULT_CAMERA_VIDEO_CONSTRAINTS

const SCREEN_SHARE_VIDEO_CONSTRAINTS: MediaTrackConstraints = {
  width: { ideal: 1920 },
  height: { ideal: 1080 },
  frameRate: { ideal: 30, max: 30 },
}

const STAGE_RECORDING_READY_TIMEOUT_MS = 10_000
const STAGE_RECORDING_POLL_INTERVAL_MS = 100
const STAGE_RECORDING_SOFT_READY_MS = 1_000

type MediaErrorCode =
  | "not_allowed"
  | "not_found"
  | "not_readable"
  | "overconstrained"
  | "unknown"

export interface MediaError {
  code: MediaErrorCode
  message: string
  original: unknown
}

function mapMediaError(err: unknown): MediaError {
  if (!(err instanceof DOMException)) {
    return {
      code: "unknown",
      message: "Failed to access media devices",
      original: err,
    }
  }

  switch (err.name) {
    case "NotAllowedError":
    case "PermissionDeniedError":
      return {
        code: "not_allowed",
        message: "Camera/microphone permission denied",
        original: err,
      }
    case "NotFoundError":
    case "DevicesNotFoundError":
      return {
        code: "not_found",
        message: "No camera or microphone found",
        original: err,
      }
    case "NotReadableError":
    case "TrackStartError":
      return {
        code: "not_readable",
        message: "Camera or microphone is already in use",
        original: err,
      }
    case "OverconstrainedError":
      return {
        code: "overconstrained",
        message: "Camera does not meet the requested constraints",
        original: err,
      }
    default:
      return {
        code: "unknown",
        message: err.message || "Failed to access media devices",
        original: err,
      }
  }
}

export function tagStageRecordingStream(stream: MediaStream): MediaStream {
  Object.defineProperty(stream, "id", {
    value: STAGE_RECORDING_STREAM_ID,
    configurable: true,
  })

  return stream
}

export function stageRecordingOutboundActive(stats: RTCStatsReport): boolean {
  for (const report of stats.values()) {
    if (report.type !== "outbound-rtp") continue

    const bytesSent = "bytesSent" in report ? report.bytesSent : 0
    const framesEncoded = "framesEncoded" in report ? report.framesEncoded : 0
    if (
      (typeof bytesSent === "number" && bytesSent > 0) ||
      (typeof framesEncoded === "number" && framesEncoded > 0)
    ) {
      if (!("kind" in report) || report.kind === "video") {
        return true
      }
    }
  }

  return false
}

function requestVideoFrame(track: MediaStreamTrack | null | undefined): void {
  if (!track || !("requestFrame" in track)) return
  const requestFrame = track.requestFrame
  if (typeof requestFrame === "function") {
    requestFrame.call(track)
  }
}

function stageRecordingSenderIsSendCapable(
  pc: RTCPeerConnection,
  sender: RTCRtpSender,
): boolean {
  const transceiver = pc.getTransceivers().find((item) => item.sender === sender)
  if (!transceiver) return false

  const direction = transceiver.currentDirection ?? transceiver.direction
  return direction === "sendonly" || direction === "sendrecv"
}

function isVideoTransceiver(transceiver: RTCRtpTransceiver): boolean {
  if (transceiver.sender.track?.kind === "video") return true
  if (transceiver.receiver.track?.kind === "video") return true
  return false
}

export function findStageRecordingTransceiver(
  pc: RTCPeerConnection,
): RTCRtpTransceiver | undefined {
  const videoTransceivers = pc
    .getTransceivers()
    .filter((transceiver) => isVideoTransceiver(transceiver))

  if (videoTransceivers.length >= 2) {
    return videoTransceivers[1]
  }

  const transceivers = pc.getTransceivers()
  if (transceivers.length >= 3) {
    return transceivers[2]
  }

  return undefined
}

export class MediaDeviceManager {
  private readonly stageRecordingSenders = new WeakMap<
    RTCPeerConnection,
    RTCRtpSender
  >()
  private stagePlaceholderStream: MediaStream | null = null

  private getStageRecordingPlaceholderTrack(): MediaStreamTrack {
    if (!this.stagePlaceholderStream) {
      const canvas = document.createElement("canvas")
      canvas.width = 2
      canvas.height = 2
      const ctx = canvas.getContext("2d")
      ctx?.fillRect(0, 0, 2, 2)
      this.stagePlaceholderStream = tagStageRecordingStream(
        canvas.captureStream(5),
      )
    }

    const track = this.stagePlaceholderStream.getVideoTracks()[0]
    if (!track || track.readyState === "ended") {
      this.stagePlaceholderStream = null
      return this.getStageRecordingPlaceholderTrack()
    }

    return track
  }

  async getUserMedia(
    constraints?: MediaStreamConstraints,
  ): Promise<MediaStream> {
    const resolved: MediaStreamConstraints = constraints ?? {
      audio: DEFAULT_AUDIO_CONSTRAINTS,
      video: DEFAULT_VIDEO_CONSTRAINTS,
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia(resolved)
      signalingLog("getUserMedia acquired", {
        audio: stream.getAudioTracks().length,
        video: stream.getVideoTracks().length,
      })
      return stream
    } catch (err) {
      const mapped = mapMediaError(err)
      signalingWarn("getUserMedia failed", mapped)
      throw new Error(mapped.message)
    }
  }

  async getDisplayMedia(): Promise<MediaStream> {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: SCREEN_SHARE_VIDEO_CONSTRAINTS,
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
        },
      })
      signalingLog("getDisplayMedia acquired")
      return stream
    } catch (err) {
      const mapped = mapMediaError(err)
      signalingWarn("getDisplayMedia failed", mapped)
      throw new Error(mapped.message)
    }
  }

  isStageRecordingSender(
    pc: RTCPeerConnection,
    sender: RTCRtpSender,
  ): boolean {
    return this.stageRecordingSenders.get(pc) === sender
  }

  async replaceTrack(
    pc: RTCPeerConnection,
    newTrack: MediaStreamTrack,
  ): Promise<void> {
    const sender = this.findSenderForKind(pc, newTrack.kind)
    if (!sender) {
      throw new Error(`No sender found for ${newTrack.kind} track`)
    }

    await sender.replaceTrack(newTrack)
    signalingLog("replaceTrack complete", newTrack.kind)
  }

  /** Attach or swap a local track, reusing an SFU video transceiver when needed. */
  async addOrReplaceTrack(
    pc: RTCPeerConnection,
    stream: MediaStream,
    track: MediaStreamTrack,
  ): Promise<void> {
    const sender = this.findSenderForKind(pc, track.kind)

    if (sender) {
      await sender.replaceTrack(track)
      const transceiver = pc
        .getTransceivers()
        .find((item) => item.sender === sender)
      if (
        transceiver &&
        !this.isStageRecordingSender(pc, sender) &&
        (transceiver.direction === "recvonly" ||
          transceiver.direction === "inactive")
      ) {
        transceiver.direction = "sendrecv"
      }
    } else {
      const transceiver = pc.addTransceiver(track, {
        direction: "sendrecv",
        streams: [stream],
      })
      void transceiver.sender.replaceTrack(track)
    }

    signalingLog("addOrReplaceTrack complete", track.kind)
  }

  /** Stop local capture tracks and detach them from the peer connection. */
  async releaseLocalTrack(
    pc: RTCPeerConnection,
    stream: MediaStream,
    kind: MediaStreamTrack["kind"],
    options?: { keepSender?: boolean },
  ): Promise<void> {
    const tracks =
      kind === "audio"
        ? [...stream.getAudioTracks()]
        : [...stream.getVideoTracks()]

    for (const track of tracks) {
      stream.removeTrack(track)
      track.stop()
    }

    if (!options?.keepSender) {
      const sender = this.findSenderForKind(pc, kind)
      if (sender) {
        sender.track?.stop()
        await sender.replaceTrack(null).catch(() => undefined)
      }
    }

    signalingLog("releaseLocalTrack complete", kind)
  }

  findSenderForKind(
    pc: RTCPeerConnection,
    kind: MediaStreamTrack["kind"],
  ): RTCRtpSender | undefined {
    const stageSender = this.stageRecordingSenders.get(pc)

    const direct = pc
      .getSenders()
      .find(
        (sender) =>
          sender !== stageSender && sender.track?.kind === kind,
      )
    if (direct) return direct

    return pc
      .getTransceivers()
      .find((transceiver) => {
        if (transceiver.sender === stageSender) return false
        return (
          transceiver.sender.track?.kind === kind ||
          transceiver.receiver.track?.kind === kind
        )
      })?.sender
  }

  muteTrack(track: MediaStreamTrack): void {
    track.enabled = false
  }

  unmuteTrack(track: MediaStreamTrack): void {
    track.enabled = true
  }

  stopStream(stream: MediaStream | null): void {
    stream?.getTracks().forEach((track) => track.stop())
  }

  stopTrack(track: MediaStreamTrack): void {
    track.stop()
  }

  async ensureStageRecordingTransceiver(pc: RTCPeerConnection): Promise<RTCRtpSender> {
    let transceiver = findStageRecordingTransceiver(pc)
    const existing = this.stageRecordingSenders.get(pc)

    if (existing) {
      transceiver =
        pc.getTransceivers().find((item) => item.sender === existing) ??
        transceiver
    }

    if (!transceiver) {
      throw new Error("Stage recording transceiver not available from SFU offer")
    }

    transceiver.direction = "sendonly"
    const sender = transceiver.sender
    this.stageRecordingSenders.set(pc, sender)

    if (!sender.track || sender.track.readyState === "ended") {
      const placeholder = this.getStageRecordingPlaceholderTrack()
      await sender.replaceTrack(placeholder)
    }

    signalingLog("stage recording transceiver bound", {
      mid: transceiver.mid,
      transceivers: pc.getTransceivers().length,
    })
    return sender
  }

  async publishStageRecordingTrack(
    pc: RTCPeerConnection,
    stream: MediaStream,
  ): Promise<void> {
    const tagged = tagStageRecordingStream(stream)
    const track = tagged.getVideoTracks()[0]
    if (!track) {
      throw new Error("Stage recording stream has no video track")
    }
    if (track.readyState === "ended") {
      throw new Error("Stage recording compositor track is not live")
    }

    const sender = await this.ensureStageRecordingTransceiver(pc)
    await sender.replaceTrack(track)
    requestVideoFrame(track)
    await this.waitForStageRecordingReady(pc, sender)
    signalingLog("stage recording track published")
  }

  async unpublishStageRecordingTrack(pc: RTCPeerConnection): Promise<void> {
    const sender = this.stageRecordingSenders.get(pc)
    if (!sender) return

    const placeholder = this.getStageRecordingPlaceholderTrack()
    await sender.replaceTrack(placeholder)
    signalingLog("stage recording track unpublished")
  }

  private async waitForStageRecordingReady(
    pc: RTCPeerConnection,
    sender: RTCRtpSender,
    timeoutMs = STAGE_RECORDING_READY_TIMEOUT_MS,
  ): Promise<void> {
    const deadline = Date.now() + timeoutMs
    const startedAt = Date.now()
    const connectionReady = () => {
      const state = pc.connectionState
      return state === "connected" || state === "connecting"
    }

    while (Date.now() < deadline) {
      const track = sender.track
      const connReady = connectionReady()
      const trackLive = track?.readyState === "live"
      const sendCapable = stageRecordingSenderIsSendCapable(pc, sender)

      requestVideoFrame(track)

      if (trackLive && connReady) {
        const stats = await sender.getStats()
        if (stageRecordingOutboundActive(stats)) {
          return
        }

        const iceReady =
          pc.iceConnectionState === "connected" ||
          pc.iceConnectionState === "completed"
        const elapsed = Date.now() - startedAt
        if (
          elapsed >= STAGE_RECORDING_SOFT_READY_MS &&
          sendCapable &&
          pc.connectionState === "connected" &&
          iceReady
        ) {
          return
        }
      }

      await new Promise((resolve) =>
        window.setTimeout(resolve, STAGE_RECORDING_POLL_INTERVAL_MS),
      )
    }

    throw new Error("Stage recording track did not become ready")
  }
}

export const mediaDeviceManager = new MediaDeviceManager()
