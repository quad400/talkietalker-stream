import { cookies } from "next/headers"
import { NextResponse } from "next/server"

import {
  parseSession,
  serializeSession,
  SESSION_COOKIE,
  type Session,
} from "@/lib/session"

export async function GET() {
  const jar = await cookies()
  const session = parseSession(jar.get(SESSION_COOKIE)?.value)
  return NextResponse.json(session)
}

export async function POST(req: Request) {
  const body = (await req.json()) as Partial<Session>

  const name = body.name?.trim()
  const role = body.role
  if (!name || (role !== "instructor" && role !== "student")) {
    return NextResponse.json({ error: "name and role are required" }, { status: 400 })
  }

  const session: Session = { name, role }
  const jar = await cookies()
  jar.set(SESSION_COOKIE, serializeSession(session), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  })

  return NextResponse.json(session)
}

export async function DELETE() {
  const jar = await cookies()
  jar.delete(SESSION_COOKIE)
  return NextResponse.json({ cleared: true })
}
