import { defaultLabelsEn } from "./defaultLabels.en.js"

export type TalkieTalkerStreamLabels = {
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

const localeDefaults: Record<string, TalkieTalkerStreamLabels> = {
  en: defaultLabelsEn,
}

export function resolveLabels(
  locale = "en",
  overrides?: Partial<TalkieTalkerStreamLabels>,
): TalkieTalkerStreamLabels {
  const base = localeDefaults[locale] ?? defaultLabelsEn
  if (!overrides) return base
  return { ...base, ...overrides }
}
