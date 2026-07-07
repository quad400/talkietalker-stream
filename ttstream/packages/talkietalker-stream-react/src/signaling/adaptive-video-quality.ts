import type { PeerConnectionManager } from "./peer-connection-manager"
import type { ConnectionQuality, ParsedStats } from "./types"
import {
  DEFAULT_VIDEO_QUALITY_TIER,
  getVideoQualityProfile,
  VIDEO_QUALITY_TIER_ORDER,
  type VideoQualityMode,
  type VideoQualityTier,
} from "./video-quality"

const UPGRADE_GOOD_POLLS_REQUIRED = 1
const DOWNGRADE_POLLS_REQUIRED = 4
const BITRATE_HEADROOM_RATIO = 0.8
const TIER_CHANGE_COOLDOWN_MS = 10_000
const JOIN_GRACE_MS = 20_000

export interface AdaptiveVideoQualityOptions {
  skip?: boolean
  videoTrack?: MediaStreamTrack | null
}

export class AdaptiveVideoQualityController {
  private currentTier: VideoQualityTier = DEFAULT_VIDEO_QUALITY_TIER
  private consecutiveGoodPolls = 0
  private consecutivePoorPolls = 0
  private consecutiveBadPolls = 0
  private consecutiveBitrateStressPolls = 0
  private lastTierChangeAt = 0
  private graceUntil = Date.now() + JOIN_GRACE_MS
  private readonly onTierChange?: (tier: VideoQualityTier) => void
  private mode: VideoQualityMode

  constructor(
    onTierChange?: (tier: VideoQualityTier) => void,
    mode: VideoQualityMode = "adaptive-high",
  ) {
    this.onTierChange = onTierChange
    this.mode = mode
  }

  get tier(): VideoQualityTier {
    return this.currentTier
  }

  setMode(mode: VideoQualityMode): void {
    this.mode = mode
    if (mode === "max") {
      this.currentTier = "hd1080"
    }
  }

  reset(): void {
    this.currentTier = DEFAULT_VIDEO_QUALITY_TIER
    this.consecutiveGoodPolls = 0
    this.consecutivePoorPolls = 0
    this.consecutiveBadPolls = 0
    this.consecutiveBitrateStressPolls = 0
    this.lastTierChangeAt = 0
    this.graceUntil = Date.now() + JOIN_GRACE_MS
  }

  onSessionConnected(): void {
    this.currentTier = DEFAULT_VIDEO_QUALITY_TIER
    this.consecutiveGoodPolls = 0
    this.consecutivePoorPolls = 0
    this.consecutiveBadPolls = 0
    this.consecutiveBitrateStressPolls = 0
    this.lastTierChangeAt = 0
    this.graceUntil = Date.now() + JOIN_GRACE_MS
  }

  evaluate(
    stats: ParsedStats,
    quality: ConnectionQuality,
    pcm: PeerConnectionManager,
    options: AdaptiveVideoQualityOptions = {},
  ): void {
    if (options.skip) return

    if (this.mode === "max") {
      if (this.currentTier !== "hd1080") {
        void pcm.applyVideoQualityTier("hd1080", options.videoTrack).then((applied) => {
          if (!applied) return
          this.currentTier = "hd1080"
          this.onTierChange?.("hd1080")
        })
      }
      return
    }

    const targetTier = this.selectTargetTier(stats, quality)
    if (targetTier === this.currentTier) return

    if (Date.now() - this.lastTierChangeAt < TIER_CHANGE_COOLDOWN_MS) {
      return
    }

    void pcm.applyVideoQualityTier(targetTier, options.videoTrack).then((applied) => {
      if (!applied) return
      this.currentTier = targetTier
      this.lastTierChangeAt = Date.now()
      this.onTierChange?.(targetTier)
    })
  }

  private selectTargetTier(
    stats: ParsedStats,
    quality: ConnectionQuality,
  ): VideoQualityTier {
    const inGrace = Date.now() < this.graceUntil

    if (quality === "bad") {
      this.consecutiveBadPolls += 1
      this.consecutivePoorPolls = 0
      this.consecutiveGoodPolls = 0
      this.consecutiveBitrateStressPolls = 0
    } else if (quality === "poor") {
      this.consecutivePoorPolls += 1
      this.consecutiveBadPolls = 0
      this.consecutiveGoodPolls = 0
      this.consecutiveBitrateStressPolls = 0
    } else if (quality === "good" || quality === "excellent") {
      this.consecutivePoorPolls = 0
      this.consecutiveBadPolls = 0
      this.consecutiveBitrateStressPolls = 0
    } else {
      return this.currentTier
    }

    if (!inGrace) {
      const stressTier = this.resolveStressTier(stats, quality)
      if (stressTier) {
        return this.stepDownToward(this.currentTier, stressTier)
      }
    }

    if (quality !== "good" && quality !== "excellent") {
      return this.currentTier
    }

    this.consecutiveGoodPolls += 1
    if (this.consecutiveGoodPolls < UPGRADE_GOOD_POLLS_REQUIRED) {
      return this.currentTier
    }

    const currentIndex = VIDEO_QUALITY_TIER_ORDER.indexOf(this.currentTier)
    const maxTier = this.maxUpgradeTier(quality, stats)
    const maxIndex = VIDEO_QUALITY_TIER_ORDER.indexOf(maxTier)

    if (currentIndex >= maxIndex) {
      return this.currentTier
    }

    this.consecutiveGoodPolls = 0
    return VIDEO_QUALITY_TIER_ORDER[currentIndex + 1]
  }

  private resolveStressTier(
    stats: ParsedStats,
    quality: ConnectionQuality,
  ): VideoQualityTier | null {
    if (
      quality === "bad" &&
      this.consecutiveBadPolls >= DOWNGRADE_POLLS_REQUIRED
    ) {
      return "sd360"
    }

    if (
      quality === "poor" &&
      this.consecutivePoorPolls >= DOWNGRADE_POLLS_REQUIRED
    ) {
      return "sd480"
    }

    const bitrateDowngrade = this.bitrateConstrainedTier(stats)
    if (bitrateDowngrade) {
      this.consecutiveBitrateStressPolls += 1
      if (this.consecutiveBitrateStressPolls >= DOWNGRADE_POLLS_REQUIRED) {
        return bitrateDowngrade
      }
    } else {
      this.consecutiveBitrateStressPolls = 0
    }

    return null
  }

  /** Move down at most one tier per adaptation cycle toward the stress target. */
  private stepDownToward(
    current: VideoQualityTier,
    stress: VideoQualityTier,
  ): VideoQualityTier {
    const currentIndex = VIDEO_QUALITY_TIER_ORDER.indexOf(current)
    const stressIndex = VIDEO_QUALITY_TIER_ORDER.indexOf(stress)
    if (currentIndex <= stressIndex) return current
    return VIDEO_QUALITY_TIER_ORDER[currentIndex - 1]
  }

  private maxUpgradeTier(
    quality: ConnectionQuality,
    _stats: ParsedStats,
  ): VideoQualityTier {
    if (quality === "good" || quality === "excellent") {
      return "hd1080"
    }
    return "hd720"
  }

  private bitrateConstrainedTier(stats: ParsedStats): VideoQualityTier | null {
    if (stats.availableOutgoingBitrate <= 0) return null

    const currentProfile = getVideoQualityProfile(this.currentTier)
    const headroom =
      stats.availableOutgoingBitrate /
      (currentProfile.encodingParams.maxBitrate * BITRATE_HEADROOM_RATIO)

    if (headroom >= 1) return null

    const currentIndex = VIDEO_QUALITY_TIER_ORDER.indexOf(this.currentTier)
    if (currentIndex <= 0) return null

    return VIDEO_QUALITY_TIER_ORDER[currentIndex - 1]
  }
}
