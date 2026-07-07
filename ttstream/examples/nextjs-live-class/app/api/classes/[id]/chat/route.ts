import { AuthenticationError } from "@talkietalker/stream-sdk"
import { NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"
import { getTalkieTalkerStream } from "@/lib/talkietalker-stream"

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params

  const row = await prisma.liveClass.findUnique({ where: { id } })
  if (!row) {
    return NextResponse.json({ error: "not found" }, { status: 404 })
  }

  try {
    const history = await getTalkieTalkerStream().chat.listHistory(row.streamId, { limit: 50 })
    return NextResponse.json({ ...history, available: true })
  } catch (err) {
    // Chat history may require host scopes or a live session on some deployments.
    if (err instanceof AuthenticationError) {
      return NextResponse.json({
        data: [],
        has_more: false,
        available: false,
        message: "Chat history is not available with the current API key.",
      })
    }

    const message = err instanceof Error ? err.message : "Failed to load chat history"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
