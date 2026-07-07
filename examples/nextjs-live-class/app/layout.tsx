import type { Metadata } from "next"

import { SiteHeader } from "@/components/site-header"
import { Providers } from "./providers"
import "./globals.css"

export const metadata: Metadata = {
  title: "TalkieTalkerStream Live Class",
  description: "Minimal SaaS example: rooms, webhooks, recordings, and embed tokens",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <SiteHeader />
          <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
        </Providers>
      </body>
    </html>
  )
}
