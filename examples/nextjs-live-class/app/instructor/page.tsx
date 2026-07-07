"use client"

import Link from "next/link"

import { CreateClassForm } from "@/components/create-class-form"
import { ClassCard } from "@/components/class-card"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useClasses, useWebhookLogs } from "@/hooks/use-api"
import { formatDate } from "@/lib/utils"

export default function InstructorPage() {
  const classes = useClasses()
  const webhooks = useWebhookLogs()

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Instructor dashboard</h1>
        <p className="mt-2 text-muted-foreground">
          Create room-mode streams, start/stop sessions, and inspect webhook deliveries.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Schedule a class</CardTitle>
            <CardDescription>
              Calls <code>streams.create</code> then stores the mapping in Prisma.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CreateClassForm />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>SDK coverage</CardTitle>
            <CardDescription>What this example exercises end-to-end</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>Streams: create, list, retrieve, start, stop, delete</p>
            <p>Embed tokens: gated via <code>authenticateTokenRequest</code></p>
            <p>Webhooks: verified + persisted via <code>onWebhook</code></p>
            <p>Recordings & chat: list APIs on class detail</p>
            <p>React: <code>TalkieTalkerRoom</code> with host/participant roles</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="classes">
        <TabsList>
          <TabsTrigger value="classes">My classes</TabsTrigger>
          <TabsTrigger value="webhooks">Webhook log</TabsTrigger>
        </TabsList>
        <TabsContent value="classes" className="grid gap-4 md:grid-cols-2">
          {classes.data?.map((c) => <ClassCard key={c.id} liveClass={c} />)}
        </TabsContent>
        <TabsContent value="webhooks">
          <Card>
            <CardHeader>
              <CardTitle>Recent events</CardTitle>
              <CardDescription>
                Point your TalkieTalkerStream webhook to{" "}
                <code>/api/talkietalker-stream/webhooks</code>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {webhooks.data?.length ? (
                webhooks.data.map((log) => (
                  <div key={log.id} className="rounded-lg border p-3 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant="outline">{log.eventType}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(log.createdAt)}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  No webhook events yet. Register your endpoint in the TalkieTalkerStream dashboard.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <p className="text-sm text-muted-foreground">
        Open a class to start the session and join as host.{" "}
        <Link href="/" className="underline">
          Back to catalog
        </Link>
      </p>
    </div>
  )
}
