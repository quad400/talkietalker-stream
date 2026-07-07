export type EmbedBridgeEvent =
  | { type: "talkietalker-stream:joined"; payload: { roomId?: string; streamId?: string; participantId?: string } }
  | { type: "talkietalker-stream:left"; payload: { reason?: string } }
  | { type: "talkietalker-stream:error"; payload: { code?: string; message: string } }

export function postEmbedEvent(event: EmbedBridgeEvent, targetOrigin = "*") {
  if (typeof window === "undefined" || window.parent === window) return
  window.parent.postMessage(event, targetOrigin)
}

export function isEmbedBridgeEvent(data: unknown): data is EmbedBridgeEvent {
  if (!data || typeof data !== "object") return false
  const type = (data as { type?: unknown }).type
  return (
    type === "talkietalker-stream:joined" ||
    type === "talkietalker-stream:left" ||
    type === "talkietalker-stream:error"
  )
}
