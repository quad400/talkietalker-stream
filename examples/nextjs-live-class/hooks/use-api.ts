"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
  queryKeys,
  type ChatMessageDto,
  type LiveClassDto,
  type RecordingDto,
  type WebhookLogDto,
} from "@/lib/queries"
import type { Session, SessionRole } from "@/lib/session"

async function readJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init)
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string }
    throw new Error(body.error ?? res.statusText)
  }
  return res.json() as Promise<T>
}

export function useSession() {
  return useQuery({
    queryKey: queryKeys.session,
    queryFn: () => readJson<Session | null>("/api/session"),
  })
}

export function useSetSession() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (session: Session) =>
      readJson<Session>("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(session),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.session }),
  })
}

export function useClasses(status?: string) {
  const qs = status ? `?status=${status}` : ""
  return useQuery({
    queryKey: queryKeys.classes(status),
    queryFn: () => readJson<LiveClassDto[]>(`/api/classes${qs}`),
    refetchInterval: 10_000,
  })
}

export function useClass(id: string, studentName?: string) {
  const qs = studentName ? `?studentName=${encodeURIComponent(studentName)}` : ""
  return useQuery({
    queryKey: [...queryKeys.class(id), studentName ?? ""] as const,
    queryFn: () => readJson<LiveClassDto>(`/api/classes/${id}${qs}`),
    enabled: Boolean(id),
    refetchInterval: 5_000,
  })
}

export function useCreateClass() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: { title: string; description?: string; hostName: string }) =>
      readJson<LiveClassDto>("/api/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["classes"] }),
  })
}

export function useStartClass(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (hostName: string) =>
      readJson(`/api/classes/${id}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hostName }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.class(id) })
      qc.invalidateQueries({ queryKey: ["classes"] })
    },
  })
}

export function useStopClass(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (hostName: string) =>
      readJson(`/api/classes/${id}/stop`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hostName }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.class(id) })
      qc.invalidateQueries({ queryKey: ["classes"] })
    },
  })
}

export function useEnroll(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (studentName: string) =>
      readJson(`/api/classes/${id}/enroll`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentName }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.class(id) }),
  })
}

export function useRecordings() {
  return useQuery({
    queryKey: queryKeys.recordings,
    queryFn: async () => {
      const res = await readJson<{ data: RecordingDto[] }>("/api/recordings")
      return res.data ?? []
    },
  })
}

export function useWebhookLogs() {
  return useQuery({
    queryKey: queryKeys.webhooks,
    queryFn: () => readJson<WebhookLogDto[]>("/api/webhooks"),
    refetchInterval: 15_000,
  })
}

export function useChatHistory(classId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.chat(classId),
    queryFn: async () => {
      const res = await readJson<{
        data: ChatMessageDto[]
        available?: boolean
        message?: string
      }>(`/api/classes/${classId}/chat`)
      return {
        messages: res.data ?? [],
        available: res.available !== false,
        message: res.message,
      }
    },
    enabled: Boolean(classId) && enabled,
    retry: false,
  })
}

export type { SessionRole }
