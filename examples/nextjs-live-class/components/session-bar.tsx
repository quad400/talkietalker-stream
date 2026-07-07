"use client"

import { Button } from "@/components/ui/button"
import { useSession, useSetSession } from "@/hooks/use-api"
import { SignInForm } from "@/components/sign-in-form"

export function SessionBar() {
  const { data: session } = useSession()
  const setSession = useSetSession()

  if (session) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">
          {session.name} · {session.role}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={async () => {
            await fetch("/api/session", { method: "DELETE" })
            setSession.reset()
            window.location.reload()
          }}
        >
          Sign out
        </Button>
      </div>
    )
  }

  return <SignInForm compact submitLabel="Join app" />
}
