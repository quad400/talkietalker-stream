import type { ConnectionQuality, ParsedStats } from "./types"

const POLL_INTERVAL_MS = 2_000

export interface QualityInputs {
  roundTripTime: number
  /** Packets lost since the previous stats poll (not lifetime cumulative). */
  lossDelta: number
}

export function deriveQuality({
  roundTripTime,
  lossDelta,
}: QualityInputs): ConnectionQuality {
  const rtt = roundTripTime

  // RTT not available yet — don't label "bad" without network timing data
  if (rtt <= 0) {
    if (lossDelta === 0) return "unknown"
    if (lossDelta < 5) return "poor"
    return "poor"
  }

  if (rtt < 50 && lossDelta === 0) return "excellent"
  if (rtt < 150 && lossDelta < 3) return "good"
  if (rtt < 400 && lossDelta < 10) return "poor"
  return "bad"
}

function parseStatsReport(report: RTCStatsReport): ParsedStats {
  const stats: ParsedStats = {
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
    timestamp: Date.now(),
  }

  report.forEach((entry) => {
    switch (entry.type) {
      case "inbound-rtp":
        if (entry.kind === "audio") {
          stats.audioPacketsLost += entry.packetsLost ?? 0
          stats.audioJitter = Math.max(stats.audioJitter, entry.jitter ?? 0)
        }
        if (entry.kind === "video") {
          stats.videoPacketsLost += entry.packetsLost ?? 0
          stats.videoFrameRate = Math.max(
            stats.videoFrameRate,
            entry.framesPerSecond ?? 0,
          )
          if (entry.frameWidth && entry.frameHeight) {
            const resolution = `${entry.frameWidth}×${entry.frameHeight}`
            stats.currentResolution = resolution
            const pixels = entry.frameWidth * entry.frameHeight
            const currentBest = stats.inboundVideoResolution
              ? Number.parseInt(stats.inboundVideoResolution.split("×")[0] ?? "0", 10) *
                Number.parseInt(stats.inboundVideoResolution.split("×")[1] ?? "0", 10)
              : 0
            if (pixels >= currentBest) {
              stats.inboundVideoResolution = resolution
            }
            const trackId = entry.trackIdentifier as string | undefined
            if (trackId) {
              stats.inboundVideoResolutionsByTrackId[trackId] = resolution
            }
          }
        }
        break

      case "outbound-rtp":
        if (entry.kind === "video") {
          stats.outboundVideoRetransmissions +=
            entry.retransmittedPacketsSent ?? 0
        }
        break

      case "candidate-pair":
        if (entry.state === "succeeded" && entry.nominated) {
          const rtt = (entry.currentRoundTripTime ?? 0) * 1000
          if (rtt > 0) {
            stats.roundTripTime = rtt
          }
          stats.availableOutgoingBitrate =
            entry.availableOutgoingBitrate ?? stats.availableOutgoingBitrate
        }
        break
    }
  })

  return stats
}

export class StatsCollector {
  private interval: ReturnType<typeof setInterval> | null = null
  private pc: RTCPeerConnection | null = null
  private previousAudioLoss = 0
  private previousOutboundVideoRetransmissions = 0

  start(
    pc: RTCPeerConnection,
    onStats: (stats: ParsedStats, quality: ConnectionQuality) => void,
  ): void {
    this.stop()
    this.pc = pc
    this.previousAudioLoss = 0
    this.previousOutboundVideoRetransmissions = 0

    this.interval = setInterval(async () => {
      if (!this.pc || this.pc.connectionState === "closed") {
        this.stop()
        return
      }

      try {
        const report = await this.pc.getStats()
        const parsed = parseStatsReport(report)
        const audioLossDelta = Math.max(
          0,
          parsed.audioPacketsLost - this.previousAudioLoss,
        )
        const retransmitDelta = Math.max(
          0,
          parsed.outboundVideoRetransmissions -
            this.previousOutboundVideoRetransmissions,
        )
        this.previousAudioLoss = parsed.audioPacketsLost
        this.previousOutboundVideoRetransmissions =
          parsed.outboundVideoRetransmissions
        const lossDelta = audioLossDelta + Math.ceil(retransmitDelta / 5)

        const quality = deriveQuality({
          roundTripTime: parsed.roundTripTime,
          lossDelta,
        })

        onStats({ ...parsed, lossDelta }, quality)
      } catch {
        // PC may have been closed between check and getStats
      }
    }, POLL_INTERVAL_MS)
  }

  stop(): void {
    if (this.interval) {
      clearInterval(this.interval)
      this.interval = null
    }
    this.pc = null
    this.previousAudioLoss = 0
    this.previousOutboundVideoRetransmissions = 0
  }
}
