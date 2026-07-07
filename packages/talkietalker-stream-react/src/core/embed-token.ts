export type EmbedBranding = {
  app_name?: string
  logo_url?: string
  primary_color?: string
  background_color?: string
  font_family?: string
  show_talkietalker_stream_badge?: boolean
  custom_css_url?: string | null
}

export type EmbedFeatures = {
  chat?: boolean
  screen_share?: boolean
  recording?: boolean
  waiting_room?: boolean
  breakouts?: boolean
  reactions?: boolean
}

export type EmbedClaimsPayload = {
  branding?: EmbedBranding
  features?: EmbedFeatures
}

export function parseEmbedClaims(token: string): EmbedClaimsPayload {
  const parts = token.split(".")
  if (parts.length < 2) return {}
  try {
    const json = decodeBase64Url(parts[1])
    const payload = JSON.parse(json) as Record<string, unknown>
    return {
      branding: payload.branding as EmbedBranding | undefined,
      features: payload.features as EmbedFeatures | undefined,
    }
  } catch {
    return {}
  }
}

function decodeBase64Url(input: string): string {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/")
  const pad = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4))
  if (typeof atob === "function") {
    return atob(padded + pad)
  }
  return Buffer.from(padded + pad, "base64").toString("utf8")
}

export function parseEmbedExpiryMs(token: string): number | null {
  const parts = token.split(".")
  if (parts.length < 2) return null
  try {
    const json = decodeBase64Url(parts[1])
    const payload = JSON.parse(json) as { exp?: number }
    return payload.exp ? payload.exp * 1000 : null
  } catch {
    return null
  }
}

export function brandingToTheme(branding?: EmbedBranding) {
  if (!branding) return undefined
  return {
    primaryColor: branding.primary_color,
    backgroundColor: branding.background_color,
    fontFamily: branding.font_family,
    logoUrl: branding.logo_url,
    showBranding: branding.show_talkietalker_stream_badge ?? true,
    appName: branding.app_name,
  }
}

export function embedFeaturesToRoomFeatures(features?: EmbedFeatures) {
  if (!features) return undefined
  return {
    chat: features.chat,
    screenShare: features.screen_share,
    waitingRoom: features.waiting_room,
  }
}
