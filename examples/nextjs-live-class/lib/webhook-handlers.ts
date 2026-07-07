import type { WebhookEvent } from "@talkietalker/stream-sdk"

export function extractStreamId(event: WebhookEvent): string | null {
  const data = event.data
  if (!data || typeof data !== "object") return null

  const record = data as Record<string, unknown>
  const stream = record.stream
  if (stream && typeof stream === "object" && "id" in stream) {
    return String((stream as { id: string }).id)
  }

  const embed = record.embed_session
  if (embed && typeof embed === "object" && "stream_id" in embed) {
    return String((embed as { stream_id: string }).stream_id)
  }

  const recording = record.recording
  if (recording && typeof recording === "object" && "stream_id" in recording) {
    return String((recording as { stream_id: string }).stream_id)
  }

  return null
}

export async function syncClassStatusFromWebhook(event: WebhookEvent) {
  const { prisma } = await import("./prisma")
  const streamId = extractStreamId(event)
  if (!streamId) return

  if (event.type === "stream.started" || event.type === "room.meeting.started") {
    await prisma.liveClass.updateMany({
      where: { streamId },
      data: { status: "live" },
    })
    return
  }

  if (event.type === "stream.ended" || event.type === "room.meeting.ended") {
    await prisma.liveClass.updateMany({
      where: { streamId },
      data: { status: "ended" },
    })
  }
}
