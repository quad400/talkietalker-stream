export type VideoQualityTier = "hd1080" | "hd720" | "sd480" | "sd360"

export type VideoQualityMode = "adaptive-high" | "max"

export interface VideoQualityProfile {
  tier: VideoQualityTier
  label: string
  captureConstraints: MediaTrackConstraints
  encodingParams: {
    maxBitrate: number
    maxFramerate: number
    scaleResolutionDownBy: number
  }
}

export interface ScreenShareEncodingProfile {
  maxBitrate: number
  maxFramerate: number
  scaleResolutionDownBy: number
  contentHint: "detail" | "text" | "motion"
}

export const DEFAULT_VIDEO_QUALITY_TIER: VideoQualityTier = "hd1080"

export const DEFAULT_VIDEO_QUALITY_MODE: VideoQualityMode = "adaptive-high"

export const VIDEO_QUALITY_TIER_ORDER: VideoQualityTier[] = [
  "sd360",
  "sd480",
  "hd720",
  "hd1080",
]

export const VIDEO_QUALITY_PROFILES: Record<VideoQualityTier, VideoQualityProfile> =
  {
    hd1080: {
      tier: "hd1080",
      label: "1080p",
      captureConstraints: {
        width: { ideal: 1920, max: 1920 },
        height: { ideal: 1080, max: 1080 },
        frameRate: { ideal: 30, max: 60 },
        facingMode: "user",
      },
      encodingParams: {
        maxBitrate: 5_500_000,
        maxFramerate: 30,
        scaleResolutionDownBy: 1.0,
      },
    },
    hd720: {
      tier: "hd720",
      label: "720p",
      captureConstraints: {
        width: { ideal: 1280, max: 1920 },
        height: { ideal: 720, max: 1080 },
        frameRate: { ideal: 30, max: 60 },
        facingMode: "user",
      },
      encodingParams: {
        maxBitrate: 3_000_000,
        maxFramerate: 30,
        scaleResolutionDownBy: 1.0,
      },
    },
    sd480: {
      tier: "sd480",
      label: "480p",
      captureConstraints: {
        width: { ideal: 854, max: 1280 },
        height: { ideal: 480, max: 720 },
        frameRate: { ideal: 24, max: 30 },
        facingMode: "user",
      },
      encodingParams: {
        maxBitrate: 800_000,
        maxFramerate: 24,
        scaleResolutionDownBy: 1.5,
      },
    },
    sd360: {
      tier: "sd360",
      label: "360p",
      captureConstraints: {
        width: { ideal: 640, max: 854 },
        height: { ideal: 360, max: 480 },
        frameRate: { ideal: 20, max: 24 },
        facingMode: "user",
      },
      encodingParams: {
        maxBitrate: 400_000,
        maxFramerate: 20,
        scaleResolutionDownBy: 2.0,
      },
    },
  }

export const SCREEN_SHARE_ENCODING: ScreenShareEncodingProfile = {
  maxBitrate: 6_000_000,
  maxFramerate: 30,
  scaleResolutionDownBy: 1.0,
  contentHint: "detail",
}

/** Shared camera capture constraints — 1080p ideal. */
export const DEFAULT_CAMERA_VIDEO_CONSTRAINTS: MediaTrackConstraints =
  VIDEO_QUALITY_PROFILES.hd1080.captureConstraints

export function getVideoQualityProfile(
  tier: VideoQualityTier,
): VideoQualityProfile {
  return VIDEO_QUALITY_PROFILES[tier]
}

export function getVideoQualityLabel(tier: VideoQualityTier): string {
  return VIDEO_QUALITY_PROFILES[tier].label
}

export function isCameraVideoTrack(track: MediaStreamTrack): boolean {
  if (track.kind !== "video") return false
  return track.getSettings().displaySurface === undefined
}

export function isScreenShareVideoTrack(track: MediaStreamTrack): boolean {
  if (track.kind !== "video") return false
  return track.getSettings().displaySurface !== undefined
}
