import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { LiveClassDto } from "@/lib/queries"

function statusVariant(status: string) {
  if (status === "live") return "live" as const
  if (status === "ended") return "ended" as const
  return "secondary" as const
}

export function ClassCard({ liveClass }: { liveClass: LiveClassDto }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg">{liveClass.title}</CardTitle>
          <Badge variant={statusVariant(liveClass.status)}>{liveClass.status}</Badge>
        </div>
        <CardDescription>
          Host: {liveClass.hostName} · {liveClass.enrollmentCount} enrolled
        </CardDescription>
      </CardHeader>
      <CardContent className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {liveClass.description || "No description"}
        </p>
        <Button asChild size="sm">
          <Link href={`/class/${liveClass.id}`}>Open</Link>
        </Button>
      </CardContent>
    </Card>
  )
}
