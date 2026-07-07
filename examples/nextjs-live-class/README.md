# TalkieTalkerStream Live Class — Next.js example

A minimal but complete SaaS demo for **live classes**: instructors schedule WebRTC rooms, students enroll and join, webhooks sync state, and recordings are listed from the API.

Built with:

| Layer | Stack |
|-------|--------|
| Streaming | `@talkietalker/stream-sdk`, `@talkietalker/stream-react` |
| App data | Prisma (SQLite) |
| Client data | TanStack Query |
| UI | shadcn/ui + Tailwind |

## Prerequisites

- Stream backend on `http://localhost:8080` (or set `TALKIETALKER_STREAM_API_URL`)
- Sandbox keys from the developer dashboard

## Setup

```bash
cd examples/nextjs-live-class
npm install
cp .env.example .env.local
npm run db:push
```

Fill in `.env.local`:

```bash
TALKIETALKER_STREAM_SECRET_KEY=sk_test_...
TALKIETALKER_STREAM_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_TALKIETALKER_STREAM_PUBLISH_KEY=pk_test_...
TALKIETALKER_STREAM_API_URL=http://localhost:8080
DATABASE_URL="file:./dev.db"
```

Optional seed (creates a TalkieTalkerStream room + Prisma row):

```bash
npm run db:seed
```

Start the app:

```bash
npm run dev
```

Open [http://localhost:3002](http://localhost:3002).

## Walkthrough

1. **Sign in** — set your name and role (instructor or student) in the header.
2. **Instructor** — go to `/instructor`, create a class (`streams.create` + Prisma).
3. **Start class** — open the class, click **Start class** (`streams.start`).
4. **Student** — sign in as student, open the class, **Enroll**, then **Join room**.
5. **Token gate** — `POST /api/talkietalker-stream/token` only mints JWTs for the host or enrolled students (`authenticateTokenRequest`).
6. **Webhooks** — register `https://your-tunnel/api/talkietalker-stream/webhooks` in the dashboard; events appear under Instructor → Webhook log.
7. **Recordings** — `/recordings` lists ready VODs via `recordings.list`.

## What's included

| Path | SDK / library |
|------|----------------|
| `app/api/talkietalker-stream/[...route]/route.ts` | `talkieTalkerStreamHandlers()` — token + webhooks |
| `lib/talkietalker-stream-route.ts` | `authenticateTokenRequest`, `onWebhook` |
| `app/api/classes/*` | `streams.create/start/stop/retrieve/del` |
| `app/api/recordings/route.ts` | `recordings.list` |
| `app/api/classes/[id]/chat/route.ts` | `chat.listHistory` |
| `app/room/[id]/page.tsx` | `<TalkieTalkerRoom />` |
| `prisma/schema.prisma` | Local classes, enrollments, webhook log |

## Production notes

- Replace cookie session with your auth provider; pass real `userId` into embed tokens.
- Use Postgres instead of SQLite (`DATABASE_URL`).
- Register webhooks for `stream.*`, `room.*`, and `recording.*`.
- Add `allowedOrigins` on your TalkieTalkerStream project for your domain.

## Related docs

- [Developer quickstart](https://github.com/talkietalker/talkietalker-stream/tree/main/talkietalker-stream-docs/content/developers/quickstart.mdx)
- [Rooms & meetings](https://github.com/talkietalker/talkietalker-stream/tree/main/talkietalker-stream-docs/content/guides/rooms.mdx)
- [Server handlers](https://github.com/talkietalker/talkietalker-stream/tree/main/talkietalker-stream-docs/content/developers/backend/server-handlers.mdx)
