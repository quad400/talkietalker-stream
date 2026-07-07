"use client"

import Link from "next/link"
import { GraduationCap } from "lucide-react"

import { SessionBar } from "@/components/session-bar"
import { Button } from "@/components/ui/button"

export function SiteHeader() {
  return (
    <header className="border-b bg-card/50 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <GraduationCap className="h-5 w-5" />
          Live Class
        </Link>
        <nav className="flex items-center gap-2">
          <Button variant="ghost" asChild>
            <Link href="/instructor">Instructor</Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/recordings">Recordings</Link>
          </Button>
        </nav>
        <SessionBar />
      </div>
    </header>
  )
}
