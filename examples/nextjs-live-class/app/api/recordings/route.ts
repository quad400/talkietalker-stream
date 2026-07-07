import { NextResponse } from "next/server"

import { getTalkieTalkerStream } from "@/lib/talkietalker-stream"

export async function GET() {
  const recordings = await getTalkieTalkerStream().recordings.list({
    status: "ready",
    limit: 50,
  })

  return NextResponse.json(recordings)
}
