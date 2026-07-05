# @streamflow/node — architecture

## Packages

| Module | Purpose |
|--------|---------|
| `@streamflow/node` | REST client (`StreamFlow` class) |
| `@streamflow/node/server` | Config resolution, token minting, webhook verify |
| `@streamflow/node/handlers` | Framework-agnostic HTTP handlers |
| `@streamflow/node/next` | Next.js App Router adapter |
| `@streamflow/node/express` | Express router |
| `@streamflow/node/fastify` | Fastify plugin |

## Key model

- `sk_test_` / `sk_live_` — server only (`STREAMFLOW_SECRET_KEY`)
- `whsec_` — webhook verification (`STREAMFLOW_WEBHOOK_SECRET`)
- `pk_test_` / `pk_live_` — browser (`NEXT_PUBLIC_STREAMFLOW_PUBLISH_KEY`)

URLs are inferred from key prefix. Override with `STREAMFLOW_API_URL` for self-hosted.

## Adding a framework adapter

1. Import `createStreamFlowHandlers` from `@streamflow/node/handlers`
2. Map your framework's request/response to `handleToken` and `handleWebhook`
3. Keep the adapter under 50 lines — no business logic in adapters

## Security

- Never import server modules from browser code
- Webhook bodies must be verified before JSON parse
- Token route validates publish key matches secret key project
