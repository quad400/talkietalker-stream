import { NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"
import { getTalkieTalkerStream } from "@/lib/talkietalker-stream"
import type { LiveClassDto } from "@/lib/queries"

function toDto(
  row: {
    id: string
    title: string
    description: string | null
    streamId: string
    hostName: string
    status: string
    createdAt: Date
    updatedAt: Date
    _count: { enrollments: number }
  },
  stream?: LiveClassDto["stream"],
): LiveClassDto {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    streamId: row.streamId,
    hostName: row.hostName,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    enrollmentCount: row._count.enrollments,
    stream,
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const status = searchParams.get("status") ?? undefined

  const rows = await prisma.liveClass.findMany({
    where: status ? { status } : undefined,
    include: { _count: { select: { enrollments: true } } },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(rows.map((row) => toDto(row)))
}

export async function POST(req: Request) {
  const body = (await req.json()) as {
    title?: string
    description?: string
    hostName?: string
  }

  const title = body.title?.trim()
  const hostName = body.hostName?.trim()
  if (!title || !hostName) {
    return NextResponse.json({ error: "title and hostName are required" }, { status: 400 })
  }

  const sf = getTalkieTalkerStream()
  try {
    const stream = await sf.streams.create(
      {
        title,
        description: body.description?.trim(),
        mode: "room",
        visibility: "private",
        // Sandbox projects reject isRecordingEnabled: true
        isRecordingEnabled: process.env.TALKIETALKER_STREAM_RECORDING_ENABLED === "true",
      },
      { idempotencyKey: `class-${title}-${Date.now()}` },
    )

    const row = await prisma.liveClass.create({
      data: {
        title,
        description: body.description?.trim(),
        streamId: stream.id,
        hostName,
        status: stream.status ?? "idle",
      },
      include: { _count: { select: { enrollments: true } } },
    })

    return NextResponse.json(toDto(row), { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create class"
    const status = message.includes("sandbox") || message.includes("Recording") ? 400 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
