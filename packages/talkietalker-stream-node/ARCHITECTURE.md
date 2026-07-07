# @talkietalker/stream-sdk — architecture

Contributor guide for the TalkieTalkerStream Node.js SDK.

## Directory layout

```
src/
├── client.ts              # TalkieTalkerStream facade — wires resources to HttpClient
├── index.ts               # Public package exports
├── errors.ts              # Typed API error hierarchy
├── utils.ts               # Query string + body helpers
├── types/
│   └── index.ts           # TalkieTalkerStreamConfig, RequestOptions, ListResult, …
├── config/
│   ├── env.ts             # readEnv() helper
│   ├── endpoints.ts       # URL resolution, key prefix validation, ENV_NAMES
│   ├── client.ts          # resolveClientConfig() for REST client
│   └── server.ts          # resolveServerConfig() for handlers
├── core/                  # HTTP engine (hand-written, not generated)
│   ├── HttpClient.ts      # Auth, retries, request/response
│   ├── TalkieTalkerStreamResource.ts  # Base class for all resources
│   ├── parse-response.ts  # Envelope unwrap + lastResponse
│   └── retry.ts           # Rate-limit backoff helpers
├── resources/             # One file per API resource namespace
│   ├── streams.ts
│   ├── projects.ts        # includes nested ProjectAPIKeysResource
│   ├── webhooks.ts
│   ├── recordings.ts
│   ├── chat.ts
│   └── embed-tokens.ts
├── handlers/              # Framework-agnostic HTTP handlers
│   ├── types.ts           # HandlerOptions, request/response shapes
│   ├── project-resolver.ts    # SDK config + publish key validation
│   ├── token.ts           # Embed token route logic
│   ├── webhook.ts         # Webhook route logic
│   ├── create-handlers.ts # createTalkieTalkerStreamHandlers factory
│   └── index.ts           # Re-exports
├── server/                # Server-only utilities (@talkietalker/stream-sdk/server)
│   ├── mint-embed-token.ts
│   ├── errors.ts
│   └── index.ts
├── webhooks/
│   └── verify.ts          # HMAC signature verification
├── adapters/              # Express, Fastify, Next.js (< 50 lines each)
└── generated/
    └── schema.d.ts        # OpenAPI types (reference only, do not edit)
```

## Layer responsibilities

| Layer | Owns | Does not own |
|-------|------|--------------|
| `resources/` | API method signatures, param mapping, paths | HTTP transport, auth |
| `core/` | HTTP, retries, envelope parsing | Business logic |
| `config/` | Key validation, env resolution, URLs | API calls |
| `handlers/` | Token + webhook HTTP flows | Framework wiring |
| `adapters/` | Request/response mapping | Business logic |

## Adding a new resource

1. Create `src/resources/<name>.ts` extending `TalkieTalkerStreamResource`
2. Add methods calling `_makeRequest({ method, path, body, ...opts })`
3. Map camelCase params → snake_case body with `omitUndefined`
4. Register on `TalkieTalkerStream` in `client.ts`
5. Export types from `index.ts`
6. Reference `talkietalker-stream-backend/docs/openapi.yaml` for paths and shapes

## Response formats

- **Wrapped** (`{ status, message, data }`) — streams, projects, webhooks → unwrapped in `core/parse-response.ts`
- **Direct** (`{ data, pagination }` or plain object) — recordings, live streams → returned as-is

## Authentication

- `secretKey` (`sk_test_` / `sk_live_`) — `Authorization: Bearer` on all authenticated REST calls
- `publishKey` (`pk_test_` / `pk_live_`) — validated in handlers against secret key's project
- `webhookSecret` (`whsec_`) — server-only, for signature verification

## Key environment variables

| Variable | Purpose |
|----------|---------|
| `TALKIETALKER_STREAM_SECRET_KEY` | Server secret key |
| `TALKIETALKER_STREAM_PUBLISH_KEY` | Publishable key |
| `NEXT_PUBLIC_TALKIETALKER_STREAM_PUBLISH_KEY` | Publishable key (frontend convention) |
| `TALKIETALKER_STREAM_WEBHOOK_SECRET` | Webhook HMAC secret |
| `TALKIETALKER_STREAM_API_URL` | API base URL override |

## Adding a framework adapter

1. Import `createTalkieTalkerStreamHandlers` from `@talkietalker/stream-sdk/handlers`
2. Map framework request → `handleToken` / `handleWebhook`
3. Keep adapter under 50 lines — no business logic in adapters

## Security

- Never import `@talkietalker/stream-sdk/server` from browser code
- Webhook bodies must be verified before JSON parse
- Token route validates publish key matches secret key project
