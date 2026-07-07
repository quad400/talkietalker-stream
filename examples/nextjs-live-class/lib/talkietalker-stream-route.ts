import { talkieTalkerStreamHandlers } from "@talkietalker/stream-sdk/next"

import { prisma } from "@/lib/prisma"
import { syncClassStatusFromWebhook } from "@/lib/webhook-handlers"

export const { POST } = talkieTalkerStreamHandlers({
  authenticateTokenRequest: async ({ body }) => {
    const roomId = body.roomId?.trim()
    if (!roomId) return null

    const liveClass = await prisma.liveClass.findUnique({
      where: { streamId: roomId },
      include: { enrollments: true },
    })
    if (!liveClass) return null

    const name =
      body.participant?.name?.trim() ||
      body.participantName?.trim() ||
      ""
    if (!name) return null

    if (name === liveClass.hostName) {
      return {
        name,
        userId: `host-${liveClass.id}`,
        role: "host",
      }
    }

    const enrolled = liveClass.enrollments.some((e) => e.studentName === name)
    if (!enrolled) return null

    return {
      name,
      userId: `student-${liveClass.id}-${name}`,
      role: "participant",
    }
  },
  onWebhook: async (event) => {
    await prisma.webhookLog.create({
      data: {
        eventType: event.type,
        payload: JSON.stringify(event),
      },
    })
    await syncClassStatusFromWebhook(event)
  },
})
