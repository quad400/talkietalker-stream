"use client"

import { ClassCard } from "@/components/class-card"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useClasses } from "@/hooks/use-api"

export default function HomePage() {
  const all = useClasses()
  const live = useClasses("live")

  return (
    <div className="space-y-8">
      <section className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Live classes</h1>
        <p className="max-w-2xl text-muted-foreground">
          A minimal SaaS demo built with{" "}
          <code className="rounded bg-muted px-1">@talkietalker/stream-sdk</code>,{" "}
          <code className="rounded bg-muted px-1">@talkietalker/stream-react</code>, Prisma,
          TanStack Query, and shadcn/ui. Instructors schedule rooms; enrolled students join
          via gated embed tokens.
        </p>
      </section>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All classes</TabsTrigger>
          <TabsTrigger value="live">Live now</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="grid gap-4 md:grid-cols-2">
          {all.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : all.data?.length ? (
            all.data.map((c) => <ClassCard key={c.id} liveClass={c} />)
          ) : (
            <EmptyCatalog />
          )}
        </TabsContent>
        <TabsContent value="live" className="grid gap-4 md:grid-cols-2">
          {live.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : live.data?.length ? (
            live.data.map((c) => <ClassCard key={c.id} liveClass={c} />)
          ) : (
            <p className="text-sm text-muted-foreground">No live classes right now.</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function EmptyCatalog() {
  return (
    <Card className="md:col-span-2">
      <CardHeader>
        <CardTitle>No classes yet</CardTitle>
        <CardDescription>
          Sign in as an instructor and create your first class from the instructor dashboard.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        TalkieTalkerStream rooms are created via <code>talkietalkerstream.streams.create</code> with{" "}
        <code>mode: &quot;room&quot;</code> and recording enabled.
      </CardContent>
    </Card>
  )
}
