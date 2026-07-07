"use client"

import * as React from "react"

import {
  TalkieTalkerStreamClient,
  type TalkieTalkerStreamClientOptions,
} from "../client/talkietalker-stream-client.js"
import {
  applyCustomCss,
  setTalkieTalkerStreamConfig,
  themeToCssVars,
  type TalkieTalkerStreamTheme,
} from "../core/config.js"
import { resolveLabels, type TalkieTalkerStreamLabels } from "../i18n/labels.js"

const TalkieTalkerStreamClientContext = React.createContext<TalkieTalkerStreamClient | null>(null)

export type TalkieTalkerStreamProps = {
  children: React.ReactNode
  client?: TalkieTalkerStreamClient
  clientOptions?: TalkieTalkerStreamClientOptions
  getAccessToken?: () => Promise<string | null>
  wsUrl?: string
  theme?: TalkieTalkerStreamTheme
  locale?: string
  labels?: Partial<TalkieTalkerStreamLabels>
  customCssUrl?: string
}

export function TalkieTalkerStream({
  children,
  client,
  clientOptions,
  getAccessToken,
  wsUrl,
  theme,
  locale = "en",
  labels: labelOverrides,
  customCssUrl,
}: TalkieTalkerStreamProps) {
  const resolvedClient = React.useMemo(() => {
    if (client) return client
    if (clientOptions) return TalkieTalkerStreamClient.create(clientOptions)
    try {
      return TalkieTalkerStreamClient.create()
    } catch {
      return null
    }
  }, [client, clientOptions])

  React.useEffect(() => {
    const resolved = resolveLabels(locale, labelOverrides)
    setTalkieTalkerStreamConfig({ getAccessToken, wsUrl, theme, locale, labels: resolved, customCssUrl })
    return () => setTalkieTalkerStreamConfig({})
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
    <TalkieTalkerStreamClientContext.Provider value={resolvedClient}>
      <div
        className="talkietalker-stream-root"
        lang={locale}
        style={{
          ...(cssVars as React.CSSProperties),
          fontFamily: "var(--sf-font)",
        }}
        data-talkietalker-stream-labels={JSON.stringify(labels)}
      >
        {children}
      </div>
    </TalkieTalkerStreamClientContext.Provider>
  )
}

export function useTalkieTalkerStreamClient(): TalkieTalkerStreamClient {
  const client = React.useContext(TalkieTalkerStreamClientContext)
  if (!client) {
    throw new Error(
      "useTalkieTalkerStreamClient requires a publish key. Set NEXT_PUBLIC_TALKIETALKER_STREAM_PUBLISH_KEY or pass clientOptions.publishKey.",
    )
  }
  return client
}

/** @deprecated Use `TalkieTalkerStream` instead. */
export const TalkieTalkerStreamProvider = TalkieTalkerStream

/** @deprecated Use `useTalkieTalkerStreamClient` instead. */
export function useTalkieTalkerStreamConfig() {
  const client = useTalkieTalkerStreamClient()
  return { client }
}
