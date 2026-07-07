import { NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"
import { getTalkieTalkerStream } from "@/lib/talkietalker-stream"

type Params = { params: Promise<{ id: string }> }

export async function POST(req: Request, { params }: Params) {
  const { id } = await params
  const body = (await req.json()) as { hostName?: string }

  const row = await prisma.liveClass.findUnique({ where: { id } })
  if (!row) {
    return NextResponse.json({ error: "not found" }, { status: 404 })
  }

  if (body.hostName?.trim() !== row.hostName) {
    return NextResponse.json({ error: "only the host can start the class" }, { status: 403 })
  }

  const started = await getTalkieTalkerStream().streams.start(row.streamId)
  const updated = await prisma.liveClass.update({
    where: { id },
    data: { status: started.status ?? "live" },
  })

  return NextResponse.json({
    id: updated.id,
    status: updated.status,
    started_at: started.started_at,
  })
}
