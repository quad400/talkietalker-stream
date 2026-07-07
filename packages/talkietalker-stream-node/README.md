# TalkieTalkerStream Node.js Library

The TalkieTalkerStream Node library provides convenient access to the TalkieTalkerStream API from applications written in server-side JavaScript.

Use your **secret key** for server-side API calls and your **publishable key** in the browser. Never expose your secret key in client-side code.

## Requirements

Node.js **18+** (LTS recommended).

## Installation

```bash
npm install @talkietalker/stream-sdk
```

## API keys

TalkieTalkerStream authenticates API requests using key pairs tied to your project:

| Key | Prefix | Where it runs |
|-----|--------|---------------|
| Secret key | `sk_test_` / `sk_live_` | Server only — REST API, token minting |
| Publishable key | `pk_test_` / `pk_live_` | Browser / mobile — embed & watch flows |
| Webhook secret | `whsec_` | Server only — signature verification |

`sk_test_` and `pk_test_` target the sandbox. `sk_live_` and `pk_live_` target production. API and WebSocket URLs are inferred from the key prefix unless you set `TALKIETALKER_STREAM_API_URL`.

## Environment variables

```bash
# Required for server-side usage
TALKIETALKER_STREAM_SECRET_KEY=sk_test_...

# Publishable key (browser + server validation)
TALKIETALKER_STREAM_PUBLISH_KEY=pk_test_...
# or, in Next.js / frontend projects:
NEXT_PUBLIC_TALKIETALKER_STREAM_PUBLISH_KEY=pk_test_...

# Webhook signature verification (server handlers)
TALKIETALKER_STREAM_WEBHOOK_SECRET=whsec_...

# Optional — self-hosted or local development override
TALKIETALKER_STREAM_API_URL=http://localhost:8080
```

## Usage

Configure the client with your secret key, which is available in the [TalkieTalkerStream Dashboard](https://talkietalker.stream):

```ts
import TalkieTalkerStream from '@talkietalker/stream-sdk'

const tts = new TalkieTalkerStream({
  secretKey: process.env.TALKIETALKER_STREAM_SECRET_KEY!,
})

const stream = await talkietalkerstream.streams.create({
  title: 'Friday Night Stream',
  mode: 'broadcast',
  visibility: 'public',
})
```

Or resolve configuration from environment variables:

```ts
import { TalkieTalkerStream } from '@talkietalker/stream-sdk'

// Reads TALKIETALKER_STREAM_SECRET_KEY, TALKIETALKER_STREAM_PUBLISH_KEY, TALKIETALKER_STREAM_API_URL
const tts = new TalkieTalkerStream()
```

### Usage with TypeScript

The package ships with TypeScript definitions. Import `TalkieTalkerStream` as a default or named import and instantiate with `new TalkieTalkerStream()`:

```ts
import TalkieTalkerStream from '@talkietalker/stream-sdk'
import type { CreateStreamParams, StreamCreated } from '@talkietalker/stream-sdk'

const tts = new TalkieTalkerStream({ secretKey: 'sk_test_...' })

const params: CreateStreamParams = {
  title: 'Weekly standup',
  mode: 'room',
}

const stream: StreamCreated = await talkietalkerstream.streams.create(params)
```

## Configuration

The client accepts a configuration object as its only argument:

```ts
const tts = new TalkieTalkerStream({
  secretKey: 'sk_test_...',
  publishKey: 'pk_test_...',
  baseURL: 'http://localhost:8080',
  maxRetries: 3,
})
```

| Option | Default | Description |
|--------|---------|-------------|
| `secretKey` | `$TALKIETALKER_STREAM_SECRET_KEY` | Server secret key. Required for authenticated requests. |
| `publishKey` | `$TALKIETALKER_STREAM_PUBLISH_KEY` | Publishable key. Optional on the REST client; required for embed handler validation. |
| `baseURL` | Inferred from key prefix | API base URL. Override for self-hosted deployments. |
| `maxRetries` | `3` | Automatic retries on `429` rate-limit responses with exponential backoff. |
| `fetchImpl` | `globalThis.fetch` | Custom `fetch` implementation (testing or edge runtimes). |

## Per-request options

Pass a second argument to any resource method for per-request overrides:

```ts
await talkietalkerstream.streams.create(
  { title: 'Weekly standup' },
  { idempotencyKey: 'standup-2026-07-06' },
)
```

| Option | Description |
|--------|-------------|
| `idempotencyKey` | Safe retry key for `POST` requests. Cached 24h per project. |
| `unauthenticated` | Skip the `Authorization` header. Used internally for public endpoints. |

## Examining responses

Every successful API object includes a non-enumerable `lastResponse` property with request metadata:

```ts
const stream = await talkietalkerstream.streams.create({ title: 'Demo' })

stream.lastResponse.requestId  // correlates with X-Request-ID
stream.lastResponse.statusCode // HTTP status code
```

## Streams

```ts
// Create
const created = await talkietalkerstream.streams.create({
  title: 'Friday Night Stream',
  description: 'Live coding session',
  mode: 'broadcast',           // 'broadcast' | 'room'
  visibility: 'public',        // 'public' | 'private'
  isPaid: true,
  price: 4.99,
  currency: 'USD',
  accessType: 'one_time_payment',
  isRecordingEnabled: true,
  thumbnailUrl: 'https://cdn.example.com/thumb.jpg',
})

// List your streams (authenticated)
const mine = await talkietalkerstream.streams.list({ status: 'live', page: 1, limit: 20 })

// List live public streams (no auth)
const live = await talkietalkerstream.streams.listLive({ page: 1, limit: 20 })

// Retrieve, update, delete
const detail = await talkietalkerstream.streams.retrieve(streamId)
await talkietalkerstream.streams.update(streamId, { title: 'Updated title' })
await talkietalkerstream.streams.del(streamId)

// Lifecycle
const started = await talkietalkerstream.streams.start(streamId)
const stopped = await talkietalkerstream.streams.stop(streamId)
const rotated = await talkietalkerstream.streams.rotateKey(streamId)

// Viewer access
const watch = await talkietalkerstream.streams.watch(streamId)
```

## Projects

Manage projects and API keys for your account:

```ts
const project = await talkietalkerstream.projects.create({
  name: 'My App',
  slug: 'my-app',
  environment: 'sandbox',
  allowedOrigins: ['https://app.example.com'],
})

const projects = await talkietalkerstream.projects.list()
const one = await talkietalkerstream.projects.retrieve(project.id)
await talkietalkerstream.projects.update(project.id, { name: 'My App v2' })
await talkietalkerstream.projects.del(project.id)

// Nested API keys
const keys = await talkietalkerstream.projects.apiKeys.list(project.id)
const key = await talkietalkerstream.projects.apiKeys.create(project.id, {
  name: 'production',
  scopes: ['streams:read', 'streams:write'],
})
console.log(key.secret) // shown once — store securely
await talkietalkerstream.projects.apiKeys.revoke(project.id, key.id)
```

## Webhooks

Register webhook endpoints on a project and manage deliveries:

```ts
const endpoint = await talkietalkerstream.webhooks.create(projectId, {
  url: 'https://example.com/webhooks/talkietalker-stream',
  enabledEvents: ['stream.*'],
})

const endpoints = await talkietalkerstream.webhooks.list(projectId)

await talkietalkerstream.webhooks.update(endpoint.id, {
  url: 'https://example.com/webhooks/v2',
  status: 'enabled',
})

await talkietalkerstream.webhooks.test(endpoint.id)
const deliveries = await talkietalkerstream.webhooks.listDeliveries(endpoint.id, { page: 1, limit: 20 })
await talkietalkerstream.webhooks.del(endpoint.id)
```

## Recordings

```ts
const recordings = await talkietalkerstream.recordings.list({
  status: 'ready',
  page: 1,
  limit: 20,
})

const recording = await talkietalkerstream.recordings.retrieve(recordingId)
const byStream = await talkietalkerstream.recordings.retrieveByStream(streamId)

const { download_url, expires_at } = await talkietalkerstream.recordings.download(recordingId)

await talkietalkerstream.recordings.update(recordingId, {
  status: 'ready',
  durationSeconds: 3600,
})

await talkietalkerstream.recordings.del(recordingId)
```

## Chat

Per-stream chat history and moderation:

```ts
const history = await talkietalkerstream.chat.listHistory(streamId, {
  before: '2026-06-12T16:00:00Z',
  limit: 50,
})

await talkietalkerstream.chat.deleteMessage(streamId, messageId)
await talkietalkerstream.chat.pinMessage(streamId, messageId)
await talkietalkerstream.chat.unpinMessage(streamId, messageId)

await talkietalkerstream.chat.banUser(streamId, userId, { reason: 'spam' })
await talkietalkerstream.chat.unbanUser(streamId, userId)

const { data: moderators } = await talkietalkerstream.chat.listModerators(streamId)
await talkietalkerstream.chat.addModerator(streamId, { userId: moderatorUserId })
await talkietalkerstream.chat.removeModerator(streamId, moderatorId)

// Build a WebSocket URL for live chat (pass JWT as token query param)
const wsUrl = talkietalkerstream.chat.websocketUrl(
  talkietalkerstream.baseURL,
  streamId,
  accessToken,
)
```

## Embed tokens

Mint short-lived tokens for embedded room participants:

```ts
const token = await talkietalkerstream.embedTokens.create({
  resourceType: 'room',
  resourceId: roomId,
  participant: {
    name: 'Alice',
    role: 'host',
    userId: 'user_123',
  },
  ttlSeconds: 3600,
})
```

## Error handling

Failed requests throw typed errors. Every error includes `statusCode`, `code`, and `requestId` when available:

```ts
import {
  TalkieTalkerStream,
  RateLimitError,
  ValidationError,
  AuthenticationError,
  NotFoundError,
} from '@talkietalker/stream-sdk'

try {
  await talkietalkerstream.streams.create({ title: '' })
} catch (err) {
  if (err instanceof ValidationError) {
    console.error(err.code, err.requestId)
  } else if (err instanceof RateLimitError) {
    console.error('retry after', err.retryAfter)
  } else if (err instanceof AuthenticationError) {
  } else if (err instanceof NotFoundError) {
  }
}
```

The client automatically retries `429` responses up to `maxRetries` times with exponential backoff.

## Webhook signing

TalkieTalkerStream signs webhook events sent to your endpoint. You must pass the **raw** request body — not parsed JSON — to `verifyWebhookSignature`:

```ts
import { verifyWebhookSignature } from '@talkietalker/stream-sdk'

const event = verifyWebhookSignature({
  rawBody: req.body,                              // Buffer or string
  signatureHeader: req.headers['x-talkietalker-stream-signature'],
  secret: process.env.TALKIETALKER_STREAM_WEBHOOK_SECRET!,
})
```

The same helper is available from `@talkietalker/stream-sdk/server` for server-only bundles.

## Server handlers

For embed token minting and webhook ingestion, use the framework-agnostic handlers or a ready-made adapter.

### Framework adapters

#### Next.js (App Router)

```ts
// app/api/talkietalker-stream/[...path]/route.ts
import { talkieTalkerStreamHandlers } from '@talkietalker/stream-sdk/next'

export const { POST } = talkieTalkerStreamHandlers()
```

Routes:

- `POST /api/talkietalker-stream/token` — mint embed token (requires `X-TalkieTalker-Stream-Publish-Key` header)
- `POST /api/talkietalker-stream/webhooks` — receive signed webhook events

#### Express

```ts
import express from 'express'
import { talkieTalkerStreamRouter } from '@talkietalker/stream-sdk/express'

const app = express()
app.use('/api/talkietalker-stream', talkieTalkerStreamRouter())
```

#### Fastify

```ts
import Fastify from 'fastify'
import { talkieTalkerStreamPlugin } from '@talkietalker/stream-sdk/fastify'

const app = Fastify()
await app.register(talkieTalkerStreamPlugin, { prefix: '/api/talkietalker-stream' })
```

### Custom framework integration

```ts
import { createTalkieTalkerStreamHandlers } from '@talkietalker/stream-sdk/handlers'

const handlers = createTalkieTalkerStreamHandlers({
  secretKey: process.env.TALKIETALKER_STREAM_SECRET_KEY,
  webhookSecret: process.env.TALKIETALKER_STREAM_WEBHOOK_SECRET,
  onWebhook: async (event) => {
    console.log('received', event.type)
  },
})

// POST /token
const token = await handlers.handleToken(
  { roomId: '...', participantName: 'Alice' },
  { publishKey: req.headers['x-talkietalker-stream-publish-key'] },
)

// POST /webhooks
const result = await handlers.handleWebhook(rawBody, signatureHeader)
```

### Server utilities

```ts
import {
  TalkieTalkerStream,
  resolveServerConfig,
  mintEmbedToken,
  verifyWebhookSignature,
} from '@talkietalker/stream-sdk/server'

const config = resolveServerConfig()
const client = new TalkieTalkerStream({ secretKey: config.secretKey, baseURL: config.baseURL })
```

## Package exports

| Import path | Purpose |
|-------------|---------|
| `@talkietalker/stream-sdk` | REST client, types, webhook verify, config helpers |
| `@talkietalker/stream-sdk/server` | Server config, embed token minting, re-exports client |
| `@talkietalker/stream-sdk/handlers` | Framework-agnostic token + webhook handlers |
| `@talkietalker/stream-sdk/next` | Next.js App Router adapter |
| `@talkietalker/stream-sdk/express` | Express router |
| `@talkietalker/stream-sdk/fastify` | Fastify plugin |

## Self-hosted

Point the SDK at your own API by setting `baseURL` or `TALKIETALKER_STREAM_API_URL`:

```ts
const tts = new TalkieTalkerStream({
  secretKey: 'sk_test_...',
  baseURL: 'http://localhost:8080',
})
```

WebSocket URLs are derived automatically from the REST base URL.

## Security

- Never expose `sk_*` secret keys in browser code, mobile apps, or version control.
- Use `pk_*` publishable keys in the client; validate them server-side via the token handler.
- Always verify webhook signatures before parsing the JSON body.
- Import `@talkietalker/stream-sdk/server` only in server-side code.

## License

MIT
