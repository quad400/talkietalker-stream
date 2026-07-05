import {
  readPublishKeyFromEnv,
  resolveWsUrlFromPublishKey,
} from "../constants/env.js"

export type StreamFlowTheme = {
  primaryColor?: string
  borderRadius?: string
  backgroundColor?: string
  textColor?: string
  fontFamily?: string
  logoUrl?: string
  showBranding?: boolean
  appName?: string
}

export type StreamFlowConfig = {
  wsUrl?: string
  getAccessToken?: () => Promise<string | null>
  locale?: string
  theme?: StreamFlowTheme
  labels?: import("../i18n/labels.js").StreamFlowLabels
  customCssUrl?: string
}

let config: StreamFlowConfig = {}

export function setStreamFlowConfig(next: StreamFlowConfig) {
  config = { ...config, ...next }
}

export function getStreamFlowConfig(): StreamFlowConfig {
  return config
}

function readWsUrlFromEnv(): string | undefined {
  if (typeof process !== "undefined") {
    const fromNext = process.env.NEXT_PUBLIC_WS_URL?.trim()
    if (fromNext) return fromNext.replace(/\/$/, "")

    const api =
      process.env.NEXT_PUBLIC_STREAM_API_URL?.trim() ??
      process.env.NEXT_PUBLIC_API_URL?.trim()
    if (api) return api.replace(/\/$/, "").replace(/^http/i, "ws")
  }

  if (typeof import.meta !== "undefined") {
    const meta = import.meta as ImportMeta & {
      env?: Record<string, string | undefined>
    }
    const vite = meta.env?.VITE_WS_URL?.trim()
    if (vite) return vite.replace(/\/$/, "")
  }

  const publishKey = readPublishKeyFromEnv()
  if (publishKey) return resolveWsUrlFromPublishKey(publishKey)

  return undefined
}

export async function resolveAccessToken(
  explicitToken?: string | null,
): Promise<string | null> {
  if (explicitToken) return explicitToken
  if (config.getAccessToken) return config.getAccessToken()
  return null
}

export function getWsBaseUrl(explicit?: string): string {
  const configured =
    explicit?.replace(/\/$/, "") ??
    config.wsUrl?.replace(/\/$/, "") ??
    readWsUrlFromEnv()
  if (configured) return configured

  if (typeof window !== "undefined") {
    return window.location.origin.replace(/^http/i, "ws")
  }

  return "ws://localhost:8080"
}

export function themeToCssVars(
  theme?: StreamFlowTheme,
  preset: "dark" | "light" = "dark",
): Record<string, string> {
  const dark = preset === "dark"
  return {
    "--sf-primary": theme?.primaryColor ?? "#6366f1",
    "--sf-radius": theme?.borderRadius ?? "8px",
    "--sf-bg": theme?.backgroundColor ?? (dark ? "#0f172a" : "#ffffff"),
    "--sf-text": theme?.textColor ?? (dark ? "#f8fafc" : "#0f172a"),
    "--sf-surface": dark ? "#1e293b" : "#f1f5f9",
    "--sf-border": dark ? "#334155" : "#e2e8f0",
    "--sf-muted": dark ? "#94a3b8" : "#64748b",
    "--sf-font": theme?.fontFamily ?? "system-ui, sans-serif",
  }
}

/** Injects a remote stylesheet. Caller should run the returned cleanup on unmount. */
export function applyCustomCss(
  url: string,
  doc: Document = typeof document !== "undefined" ? document : (null as unknown as Document),
): () => void {
  if (!doc) return () => {}
  const link = doc.createElement("link")
  link.rel = "stylesheet"
  link.href = url
  doc.head.appendChild(link)
  return () => link.remove()
}
