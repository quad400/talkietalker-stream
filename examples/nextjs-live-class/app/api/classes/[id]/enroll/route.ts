import { NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"

type Params = { params: Promise<{ id: string }> }

export async function POST(req: Request, { params }: Params) {
  const { id } = await params
  const body = (await req.json()) as { studentName?: string }

  const studentName = body.studentName?.trim()
  if (!studentName) {
    return NextResponse.json({ error: "studentName is required" }, { status: 400 })
  }

  const liveClass = await prisma.liveClass.findUnique({ where: { id } })
  if (!liveClass) {
    return NextResponse.json({ error: "not found" }, { status: 404 })
  }

  const enrollment = await prisma.enrollment.upsert({
    where: {
      classId_studentName: { classId: id, studentName },
    },
    create: { classId: id, studentName },
    update: {},
  })

  return NextResponse.json({
    id: enrollment.id,
    studentName: enrollment.studentName,
    classId: enrollment.classId,
  })
}
