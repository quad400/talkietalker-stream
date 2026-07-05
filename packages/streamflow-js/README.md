# @streamflow/node

StreamFlow server SDK for Node.js.

## Install

```bash
npm install @streamflow/node
```

## Environment

```bash
STREAMFLOW_SECRET_KEY=sk_test_...
STREAMFLOW_WEBHOOK_SECRET=whsec_...
# Optional self-hosted override:
# STREAMFLOW_API_URL=http://localhost:8080
```

API and WebSocket URLs are inferred from your key prefix (`sk_test_` → sandbox, `sk_live_` → production).

## Framework adapters

### Next.js

```ts
import { streamflowHandlers } from '@streamflow/node/next'
export const { POST } = streamflowHandlers()
```

### Express

```ts
import express from 'express'
import { streamflowRouter } from '@streamflow/node/express'

const app = express()
app.use('/api/streamflow', streamflowRouter())
```

### Fastify

```ts
import Fastify from 'fastify'
import { streamflowPlugin } from '@streamflow/node/fastify'

const app = Fastify()
await app.register(streamflowPlugin, { prefix: '/api/streamflow' })
```

## Webhook verification

```ts
import { verifyWebhookSignature } from '@streamflow/node/server'

const event = verifyWebhookSignature({
  rawBody: req.body,
  signatureHeader: req.headers['x-streamflow-signature'],
  secret: process.env.STREAMFLOW_WEBHOOK_SECRET!,
})
```

See [ARCHITECTURE.md](./ARCHITECTURE.md) for contributor docs.
