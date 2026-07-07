"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useRecordings } from "@/hooks/use-api"
import { formatDate, formatDuration } from "@/lib/utils"

export default function RecordingsPage() {
  const { data, isLoading, error } = useRecordings()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Recordings</h1>
        <p className="mt-2 text-muted-foreground">
          Pulled from <code>recordings.list</code> — enable recording when creating a class.
        </p>
      </div>

      {isLoading ? <p className="text-muted-foreground">Loading…</p> : null}
      {error ? <p className="text-destructive">{error.message}</p> : null}

      <div className="grid gap-4 md:grid-cols-2">
        {data?.map((rec) => (
          <Card key={rec.id}>
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-base">
                  {rec.stream_title ?? rec.stream_id}
                </CardTitle>
                <Badge variant="outline">{rec.status}</Badge>
              </div>
              <CardDescription>{formatDate(rec.created_at)}</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>Duration: {formatDuration(rec.duration_seconds)}</p>
              <p className="truncate">ID: {rec.id}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {!isLoading && !data?.length ? (
        <Card>
          <CardHeader>
            <CardTitle>No recordings</CardTitle>
            <CardDescription>
              End a recorded class session to see VODs here once processing completes.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}
    </div>
  )
}
