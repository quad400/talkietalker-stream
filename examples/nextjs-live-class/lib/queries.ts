export const queryKeys = {
  session: ["session"] as const,
  classes: (status?: string) => ["classes", status ?? "all"] as const,
  class: (id: string) => ["class", id] as const,
  recordings: ["recordings"] as const,
  webhooks: ["webhooks"] as const,
  chat: (streamId: string) => ["chat", streamId] as const,
}

export type LiveClassDto = {
  id: string
  title: string
  description: string | null
  streamId: string
  hostName: string
  status: string
  createdAt: string
  updatedAt: string
  enrollmentCount: number
  isEnrolled?: boolean
  stream?: {
    viewer_count?: number
    started_at?: string | null
    ended_at?: string | null
  }
}

export type RecordingDto = {
  id: string
  stream_id: string
  stream_title?: string
  duration_seconds?: number
  status: string
  created_at?: string
}

export type WebhookLogDto = {
  id: string
  eventType: string
  payload: string
  createdAt: string
}

export type ChatMessageDto = {
  id: string
  username?: string
  content?: string
  created_at?: string
}
