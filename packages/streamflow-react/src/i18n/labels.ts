import { defaultLabelsEn } from "./defaultLabels.en.js"

export type StreamFlowLabels = {
  joinButton: string
  waitingRoomTitle: string
  muteButton: string
  unmuteButton: string
  startVideoButton: string
  stopVideoButton: string
  shareScreenButton: string
  stopShareButton: string
  leaveButton: string
  connecting: string
  poweredBy: string
  displayNamePlaceholder: string
  prejoinTitle: string
}

const localeDefaults: Record<string, StreamFlowLabels> = {
  en: defaultLabelsEn,
}

export function resolveLabels(
  locale = "en",
  overrides?: Partial<StreamFlowLabels>,
): StreamFlowLabels {
  const base = localeDefaults[locale] ?? defaultLabelsEn
  if (!overrides) return base
  return { ...base, ...overrides }
}
