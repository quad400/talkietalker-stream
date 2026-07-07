import { NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"

export async function GET() {
  const logs = await prisma.webhookLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  })

  return NextResponse.json(
    logs.map((log) => ({
      id: log.id,
      eventType: log.eventType,
      payload: log.payload,
      createdAt: log.createdAt.toISOString(),
    })),
  )
}
