"use client"

import { StreamFlow } from "@streamflow/react"
import "@streamflow/react/styles.css"

export function Providers({ children }: { children: React.ReactNode }) {
  return <StreamFlow>{children}</StreamFlow>
}
