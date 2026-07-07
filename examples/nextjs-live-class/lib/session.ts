export type SessionRole = "instructor" | "student"

export type Session = {
  name: string
  role: SessionRole
}

export const SESSION_COOKIE = "live-class-session"

export function parseSession(raw?: string | null): Session | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as Session
    if (!parsed.name?.trim() || !parsed.role) return null
    return { name: parsed.name.trim(), role: parsed.role }
  } catch {
    return null
  }
}

export function serializeSession(session: Session) {
  return JSON.stringify(session)
}
