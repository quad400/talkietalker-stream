"use client"

import * as React from "react"

type SpeechRecognitionResultEvent = {
  resultIndex: number
  results: ArrayLike<{ [index: number]: { transcript: string } | undefined; isFinal?: boolean }>
}

type SpeechRecognitionInstance = {
  continuous: boolean
  interimResults: boolean
  lang: string
  onresult: ((event: SpeechRecognitionResultEvent) => void) | null
  onerror: (() => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
}

type SpeechRecognitionCtor = new () => SpeechRecognitionInstance

function getSpeechRecognition(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null
  const w = window as Window & {
    SpeechRecognition?: SpeechRecognitionCtor
    webkitSpeechRecognition?: SpeechRecognitionCtor
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

export function useCaptionPublisher(
  enabled: boolean,
  onCaption: (text: string, final: boolean) => void,
) {
  const [supported, setSupported] = React.useState(false)
  const recognitionRef = React.useRef<SpeechRecognitionInstance | null>(null)
  const onCaptionRef = React.useRef(onCaption)

  React.useEffect(() => {
    onCaptionRef.current = onCaption
  }, [onCaption])

  React.useEffect(() => {
    setSupported(Boolean(getSpeechRecognition()))
  }, [])

  React.useEffect(() => {
    const Recognition = getSpeechRecognition()
    if (!enabled || !Recognition) {
      recognitionRef.current?.stop()
      recognitionRef.current = null
      return
    }

    const recognition = new Recognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = "en-US"

    recognition.onresult = (event) => {
      let text = ""
      let isFinal = false
      for (let i = event.resultIndex; i < event.results.length; i++) {
        text += event.results[i]?.[0]?.transcript ?? ""
        if (event.results[i]?.isFinal) {
          isFinal = true
        }
      }
      const trimmed = text.trim()
      if (trimmed) {
        onCaptionRef.current(trimmed, isFinal)
      }
    }

    recognition.onerror = () => {}

    recognition.onend = () => {
      if (enabled && recognitionRef.current === recognition) {
        try {
          recognition.start()
        } catch {
          // ignore restart races
        }
      }
    }

    recognitionRef.current = recognition
    try {
      recognition.start()
    } catch {
      setSupported(false)
    }

    return () => {
      recognitionRef.current = null
      recognition.stop()
    }
  }, [enabled])

  return { supported }
}

export type PeerCaptionLine = {
  peerId: string
  username: string
  text: string
  final: boolean
  updatedAt: number
}

export function usePeerCaptions(
  peerCaptions: Record<string, PeerCaptionLine>,
  activeSpeakerId?: string | null,
) {
  const visible = React.useMemo(() => {
    const lines = Object.values(peerCaptions).filter((line) => line.text.trim())
    if (lines.length === 0) return []

    if (activeSpeakerId && peerCaptions[activeSpeakerId]?.text) {
      return [peerCaptions[activeSpeakerId]]
    }

    return lines
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, 3)
  }, [peerCaptions, activeSpeakerId])

  return visible
}

// Backward-compatible alias
export function useClosedCaptions(enabled: boolean) {
  const [caption, setCaption] = React.useState<string | null>(null)
  const { supported } = useCaptionPublisher(enabled, (text) => setCaption(text))
  return { caption, supported }
}
