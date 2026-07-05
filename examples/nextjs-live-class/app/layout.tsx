import type { Metadata } from "next"

import { Providers } from "./providers"

export const metadata: Metadata = {
  title: "StreamFlow Live Class",
  description: "Next.js example with zero-config StreamFlow SDK",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, minHeight: "100vh", fontFamily: "system-ui, sans-serif" }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
