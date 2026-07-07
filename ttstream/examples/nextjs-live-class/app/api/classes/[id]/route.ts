import { NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"
import { getTalkieTalkerStream } from "@/lib/talkietalker-stream"
import type { LiveClassDto } from "@/lib/queries"

type Params = { params: Promise<{ id: string }> }

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

export async function GET(req: Request, { params }: Params) {
  const { id } = await params
  const { searchParams } = new URL(req.url)
  const studentName = searchParams.get("studentName")?.trim()

  const row = await prisma.liveClass.findUnique({
    where: { id },
    include: { _count: { select: { enrollments: true } } },
  })
  if (!row) {
    return NextResponse.json({ error: "not found" }, { status: 404 })
  }

  let isEnrolled: boolean | undefined
  if (studentName) {
    const enrollment = await prisma.enrollment.findUnique({
      where: { classId_studentName: { classId: id, studentName } },
    })
    isEnrolled = Boolean(enrollment)
  }

  let stream: LiveClassDto["stream"]
  try {
    const detail = await getTalkieTalkerStream().streams.retrieve(row.streamId)
    stream = {
      viewer_count: detail.viewer_count,
      started_at: detail.started_at,
      ended_at: detail.ended_at,
    }
  } catch {
    stream = undefined
  }

  return NextResponse.json({ ...toDto(row, stream), isEnrolled })
}

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params

  const row = await prisma.liveClass.findUnique({ where: { id } })
  if (!row) {
    return NextResponse.json({ error: "not found" }, { status: 404 })
  }

  await getTalkieTalkerStream().streams.del(row.streamId)
  await prisma.liveClass.delete({ where: { id } })

  return NextResponse.json({ deleted: true })
}
