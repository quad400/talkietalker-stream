import {
  DEFAULT_VIDEO_QUALITY_MODE,
  type VideoQualityMode,
} from "./video-quality"

const STORAGE_KEY = "stream:video-quality-mode"

export function readVideoQualityMode(): VideoQualityMode {
  if (typeof window === "undefined") return DEFAULT_VIDEO_QUALITY_MODE
  const stored = window.localStorage.getItem(STORAGE_KEY)
  if (stored === "max" || stored === "adaptive-high") {
    return stored
  }
  return DEFAULT_VIDEO_QUALITY_MODE
}

export function writeVideoQualityMode(mode: VideoQualityMode): void {
  if (typeof window === "undefined") return
  window.localStorage.setItem(STORAGE_KEY, mode)
}

export const VIDEO_QUALITY_MODE_OPTIONS: {
  value: VideoQualityMode
  label: string
  description: string
}[] = [
  {
    value: "adaptive-high",
    label: "High (recommended)",
    description: "Start at 1080p and reduce only on sustained poor network",
  },
  {
    value: "max",
    label: "Max",
    description: "Pin 1080p and disable adaptive downgrades",
  },
]
