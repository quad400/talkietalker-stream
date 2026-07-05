"use client"

import * as React from "react"

import {
  StreamFlowClient,
  type StreamFlowClientOptions,
} from "../client/streamflow-client.js"
import {
  applyCustomCss,
  setStreamFlowConfig,
  themeToCssVars,
  type StreamFlowTheme,
} from "../core/config.js"
import { resolveLabels, type StreamFlowLabels } from "../i18n/labels.js"

const StreamFlowClientContext = React.createContext<StreamFlowClient | null>(null)

export type StreamFlowProps = {
  children: React.ReactNode
  client?: StreamFlowClient
  clientOptions?: StreamFlowClientOptions
  getAccessToken?: () => Promise<string | null>
  wsUrl?: string
  theme?: StreamFlowTheme
  locale?: string
  labels?: Partial<StreamFlowLabels>
  customCssUrl?: string
}

export function StreamFlow({
  children,
  client,
  clientOptions,
  getAccessToken,
  wsUrl,
  theme,
  locale = "en",
  labels: labelOverrides,
  customCssUrl,
}: StreamFlowProps) {
  const resolvedClient = React.useMemo(() => {
    if (client) return client
    if (clientOptions) return StreamFlowClient.create(clientOptions)
    try {
      return StreamFlowClient.create()
    } catch {
      return null
    }
  }, [client, clientOptions])

  React.useEffect(() => {
    const resolved = resolveLabels(locale, labelOverrides)
    setStreamFlowConfig({ getAccessToken, wsUrl, theme, locale, labels: resolved, customCssUrl })
    return () => setStreamFlowConfig({})
  }, [getAccessToken, wsUrl, theme, locale, labelOverrides, customCssUrl])

  const labels = React.useMemo(
    () => resolveLabels(locale, labelOverrides),
    [locale, labelOverrides],
  )

  const cssVars = React.useMemo(() => themeToCssVars(theme), [theme])

  React.useEffect(() => {
    if (!customCssUrl) return
    return applyCustomCss(customCssUrl)
  }, [customCssUrl])

  return (
    <StreamFlowClientContext.Provider value={resolvedClient}>
      <div
        className="streamflow-root"
        lang={locale}
        style={{
          ...(cssVars as React.CSSProperties),
          fontFamily: "var(--sf-font)",
        }}
        data-streamflow-labels={JSON.stringify(labels)}
      >
        {children}
      </div>
    </StreamFlowClientContext.Provider>
  )
}

export function useStreamFlowClient(): StreamFlowClient {
  const client = React.useContext(StreamFlowClientContext)
  if (!client) {
    throw new Error(
      "useStreamFlowClient requires a publish key. Set NEXT_PUBLIC_STREAMFLOW_PUBLISH_KEY or pass clientOptions.publishKey.",
    )
  }
  return client
}

/** @deprecated Use `StreamFlow` instead. */
export const StreamFlowProvider = StreamFlow

/** @deprecated Use `useStreamFlowClient` instead. */
export function useStreamFlowConfig() {
  const client = useStreamFlowClient()
  return { client }
}
