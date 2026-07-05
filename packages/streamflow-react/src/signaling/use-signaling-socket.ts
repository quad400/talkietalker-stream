"use client"

import * as React from "react"

import {
  buildSignalingWsUrl,
  parseSignalingMessage,
  resolveAccessToken,
  signalingLog,
  signalingWarn,
  wireOutgoing,
} from "./helpers"
import type {
  SignalingIncomingMessage,
  SignalingOutgoingMessage,
} from "./types"

const INITIAL_RECONNECT_DELAY_MS = 500
const MAX_RECONNECT_DELAY_MS = 10_000
const MAX_RECONNECT_ATTEMPTS = 5

type SignalingSocketOptions = {
  onError?: (message: string) => void
  onReconnect?: () => void
  autoReconnect?: boolean
  token?: string | null
  wsUrl?: string
}

export function useSignalingSocket(
  enabled: boolean,
  onMessage: (message: SignalingIncomingMessage) => void | Promise<void>,
  onOpen?: () => void,
  options?: SignalingSocketOptions,
) {
  const wsRef = React.useRef<WebSocket | null>(null)
  const queueRef = React.useRef<string[]>([])
  const messageChainRef = React.useRef(Promise.resolve())
  const connectionIdRef = React.useRef(0)
  const reconnectTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const reconnectAttemptRef = React.useRef(0)
  const reconnectDelayRef = React.useRef(INITIAL_RECONNECT_DELAY_MS)
  const intentionalCloseRef = React.useRef(false)

  const onMessageRef = React.useRef(onMessage)
  const onOpenRef = React.useRef(onOpen)
  const onReconnectRef = React.useRef(options?.onReconnect)
  const onErrorRef = React.useRef(options?.onError)
  const autoReconnectRef = React.useRef(options?.autoReconnect !== false)
  const tokenRef = React.useRef(options?.token)
  const wsUrlRef = React.useRef(options?.wsUrl)

  React.useEffect(() => {
    onMessageRef.current = onMessage
    onOpenRef.current = onOpen
    onReconnectRef.current = options?.onReconnect
    onErrorRef.current = options?.onError
    autoReconnectRef.current = options?.autoReconnect !== false
    tokenRef.current = options?.token
    wsUrlRef.current = options?.wsUrl
  }, [onMessage, onOpen, options?.onReconnect, options?.onError, options?.autoReconnect, options?.token, options?.wsUrl])

  const clearReconnectTimer = React.useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current)
      reconnectTimerRef.current = null
    }
  }, [])

  const resetReconnectState = React.useCallback(() => {
    reconnectAttemptRef.current = 0
    reconnectDelayRef.current = INITIAL_RECONNECT_DELAY_MS
    clearReconnectTimer()
  }, [clearReconnectTimer])

  const connect = React.useCallback(
    (connectionId: number) => {
      void (async () => {
        const token = tokenRef.current ?? (await resolveAccessToken())
        const url = buildSignalingWsUrl(token, wsUrlRef.current)
        signalingLog("connecting", url.replace(/token=[^&]+/, "token=***"))

        const ws = new WebSocket(url)
        wsRef.current = ws
        messageChainRef.current = Promise.resolve()

        ws.onopen = () => {
          if (connectionId !== connectionIdRef.current) return

          const isReconnect = reconnectAttemptRef.current > 0
          if (isReconnect) {
            signalingLog("reconnected after abnormal close")
            onReconnectRef.current?.()
          }

          signalingLog("connected")
          resetReconnectState()

          for (const queued of queueRef.current) {
            ws.send(queued)
          }
          queueRef.current = []
          onOpenRef.current?.()
        }

        ws.onmessage = (event) => {
          if (connectionId !== connectionIdRef.current) return

          const message = parseSignalingMessage(String(event.data))
          if (!message) return

          signalingLog("received", message.type)
          messageChainRef.current = messageChainRef.current
            .then(() => onMessageRef.current(message))
            .catch((error) => {
              const text =
                error instanceof Error
                  ? error.message
                  : "Signaling handler failed"
              signalingWarn("handler error", error)
              onErrorRef.current?.(text)
            })
        }

        ws.onerror = () => {
          if (connectionId !== connectionIdRef.current) return
          signalingWarn("websocket error")
        }

        ws.onclose = (event) => {
          if (connectionId !== connectionIdRef.current) return

          signalingLog("closed", { code: event.code, reason: event.reason })

          if (intentionalCloseRef.current) return

          const isAbnormal =
            event.code !== 1000 && event.code !== 1001 && event.code !== 1005

          if (
            isAbnormal &&
            autoReconnectRef.current &&
            reconnectAttemptRef.current < MAX_RECONNECT_ATTEMPTS
          ) {
            reconnectAttemptRef.current++
            const delay = reconnectDelayRef.current
            reconnectDelayRef.current = Math.min(
              reconnectDelayRef.current * 2,
              MAX_RECONNECT_DELAY_MS,
            )
            signalingLog(
              `scheduling reconnect ${reconnectAttemptRef.current}/${MAX_RECONNECT_ATTEMPTS} in ${delay}ms`,
            )
            reconnectTimerRef.current = setTimeout(() => {
              if (connectionId === connectionIdRef.current) {
                connect(connectionId)
              }
            }, delay)
            return
          }

          if (isAbnormal) {
            onErrorRef.current?.(
              event.reason || `Signaling connection closed (${event.code})`,
            )
          }
        }
      })()
    },
    [resetReconnectState],
  )

  React.useEffect(() => {
    if (!enabled) return

    const connectionId = ++connectionIdRef.current
    intentionalCloseRef.current = false
    resetReconnectState()
    connect(connectionId)

    return () => {
      if (connectionId !== connectionIdRef.current) return

      intentionalCloseRef.current = true
      clearReconnectTimer()
      wsRef.current?.close()
      if (wsRef.current) wsRef.current = null
      queueRef.current = []
      messageChainRef.current = Promise.resolve()
    }
  }, [clearReconnectTimer, connect, enabled, resetReconnectState])

  const send = React.useCallback((message: SignalingOutgoingMessage) => {
    const serialized = JSON.stringify(wireOutgoing(message))
    signalingLog("send", message.type)
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(serialized)
    } else {
      queueRef.current.push(serialized)
    }
  }, [])

  const close = React.useCallback(() => {
    intentionalCloseRef.current = true
    connectionIdRef.current += 1
    clearReconnectTimer()
    wsRef.current?.close()
    wsRef.current = null
    queueRef.current = []
    messageChainRef.current = Promise.resolve()
  }, [clearReconnectTimer])

  return { send, close }
}
