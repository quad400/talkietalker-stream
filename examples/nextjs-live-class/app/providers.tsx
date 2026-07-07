"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useState } from "react"

import { TalkieTalkerStream } from "@talkietalker/stream-react"
import "@talkietalker/stream-react/styles.css"

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      <TalkieTalkerStream>{children}</TalkieTalkerStream>
    </QueryClientProvider>
  )
}
