# Sprint 04 — Server SDKs

**Duration:** 3 weeks  
**Goal:** Typed, published server SDKs for Node.js and Go (Python stretch) generated from OpenAPI.  
**Depends on:** Sprint 03  
**Blocks:** Sprint 05, 07

---

## Objectives

1. Monorepo `packages/` workspace for SDKs
2. Go SDK: `github.com/talkietalker/talkietalker-stream-go`
3. Node SDK: `@talkietalker/stream-sdk` on npm
4. Idempotency key support on mutating calls
5. CI: regenerate SDK on OpenAPI change

---

## Tasks

### Task 04.1 — Package workspace setup

**Estimate:** 3 pts

```
packages/
├── talkietalker-stream-node/
│   ├── package.json          # @talkietalker/stream-sdk
│   ├── src/
│   │   ├── client.ts
│   │   ├── resources/
│   │   │   ├── streams.ts
│   │   │   ├── projects.ts
│   │   │   ├── webhooks.ts
│   │   │   └── embed-tokens.ts
│   │   └── errors.ts
│   └── tsconfig.json
└── talkietalker-stream-go/
    ├── go.mod
    └── streamflow/
        ├── client.go
        └── streams.go
```

- [ ] Root `package.json` workspaces or separate publish
- [ ] Versioning: semver, changelog

---

### Task 04.2 — OpenAPI codegen pipeline

**Estimate:** 5 pts

**Go:** `oapi-codegen` from `talkietalker-stream-web/docs/openapi.yaml`

```bash
oapi-codegen -package talkietalkerstream -generate types,client \
  talkietalker-stream-web/docs/openapi.yaml > packages/talkietalker-stream-go/streamflow/client.gen.go
```

**Node:** `openapi-typescript` + thin wrapper OR hand-crafted for ergonomics

- [ ] CI job fails if generated code drifts from spec
- [ ] Exclude `internal` endpoints from codegen (`x-visibility: internal`)

---

### Task 04.3 — Node SDK ergonomics

**Estimate:** 8 pts

```typescript
import { TalkieTalkerStream } from '@talkietalker/stream-sdk'

const sf = new TalkieTalkerStream({ apiKey: process.env.TALKIETALKER_STREAM_SECRET_KEY })

const stream = await sf.streams.create({
  title: 'Weekly standup',
  mode: 'room',
  visibility: 'private',
}, { idempotencyKey: 'standup-2026-06-29' })

const token = await sf.embedTokens.create({
  resourceType: 'room',
  resourceId: stream.id,
  participant: { name: 'Alex' },
})
```

- [ ] Auto-retry on 429 with `Retry-After`
- [ ] Typed errors: `TalkieTalkerStreamError`, `RateLimitError`, `ValidationError`
- [ ] `baseURL` override for self-hosters
- [ ] Unit tests with MSW or nock

---

### Task 04.4 — Go SDK ergonomics

**Estimate:** 8 pts

```go
client := talkietalkerstream.NewClient("sk_live_...")
stream, err := client.Streams.Create(ctx, &talkietalkerstream.CreateStreamParams{
    Title: "Weekly standup",
    Mode:  talkietalkerstream.StreamModeRoom,
})
```

- [ ] Context support everywhere
- [ ] `Option` pattern for base URL, HTTP client
- [ ] Integration test against local API

---

### Task 04.5 — Idempotency middleware (backend)

**Estimate:** 5 pts

- [ ] Accept `Idempotency-Key` header on POST
- [ ] Store in Redis: `idempotency:{project_id}:{key}` → response cache 24h
- [ ] Return cached response on replay
- [ ] Document in OpenAPI

---

### Task 04.6 — Python SDK (stretch)

**Estimate:** 5 pts

- [ ] `streamflow-python` via openapi-generator
- [ ] Publish to PyPI if time permits

---

## Implementation prompt

```
Sprint 04 — Server SDKs.

1. Create packages/talkietalker-stream-node with @talkietalker/stream-sdk
2. Implement TalkieTalkerStream client with streams, projects, webhooks, embedTokens resources
3. Add Idempotency-Key middleware to talkietalker-stream-backend POST handlers
4. Set up GitHub Action: on openapi.yaml change, regen and fail if diff

Match error handling to Stripe Node SDK patterns (typed errors, requestId in message).
Include README with install + 5-line quickstart.
```

---

## Acceptance criteria

- [ ] `npm publish --dry-run` succeeds for `@talkietalker/stream-sdk`
- [ ] Go module `go test ./...` passes
- [ ] Quickstart in `examples/stream-sdk-quickstart/` uses SDK end-to-end
- [ ] Idempotency: duplicate POST returns same stream ID

---

## Demo script

```bash
cd examples/stream-sdk-quickstart
npm install
TALKIETALKER_STREAM_SECRET_KEY=sk_test_... node create-room.js
# Prints stream ID + embed token
```

**Next:** [Sprint 05 — Client SDK & embeddables](./sprint-05-client-sdk-and-embeddables.md)
