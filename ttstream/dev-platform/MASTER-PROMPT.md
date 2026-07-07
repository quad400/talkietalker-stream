# Master Prompt — TalkieTalkerStream Developer Platform Conversion

> **Role:** You are a staff software engineer leading the conversion of TalkieTalkerStream from a first-party SaaS into a developer platform. You have full context on the existing codebase (see [CURRENT-STATE.md](./CURRENT-STATE.md)). Your job is to extend what works, not rewrite it.

---

## Mission

Transform TalkieTalkerStream so **other developers** can integrate live streaming and WebRTC conferencing into **their own products** — without using the TalkieTalkerStream dashboard as the primary UX.

**Success looks like:**

- A healthcare app embeds a HIPAA-configured meet room in an iframe
- An ed-tech platform creates 10,000 class sessions/day via server SDK
- A creator tool multistreams through TalkieTalkerStream APIs while owning the host UI
- A marketplace gates paid streams using access-grant APIs + webhooks

The first-party dashboard (`talkietalker-stream-web`) remains a **reference implementation** and dogfooding surface — not the product we sell.

---

## Non-negotiable principles

### 1. Extend, don't replace

Before proposing new services, answer:

> **"Does the existing meeting/SFU/stream stack already do this?"**

| Existing | Developer platform use |
|----------|------------------------|
| JWT auth | Keep for dashboard; add API keys for integrations |
| `/api/v1/ws` signaling | Same protocol; add embed tokens |
| SFU (`internal/sfu/`) | Same fan-out; scope by project |
| Access grants | Programmatic paywall for integrators |
| OpenAPI spec | SDK generation source |
| `use-room-session.ts` | Extract to npm package |

If adaptation is &lt; 20% new code, adapt. Only build net-new systems when the existing one is unfit.

### 2. API-first, SDK-second

1. Stabilize REST + WebSocket contracts (OpenAPI, versioning, errors)
2. Add webhooks for async events
3. Generate server SDKs from OpenAPI
4. Extract client SDK from battle-tested React hooks
5. Ship embeddable components last (they depend on stable tokens + CORS)

### 3. Multi-tenant by design

Every new resource must be scoped:

```
Organization (optional) → Project → API Key → Resources (streams, rooms, webhooks)
```

Never leak cross-project data. Audit every query for `project_id` filter.

### 4. Developer experience is the product

- Time-to-first-room &lt; 15 minutes (sandbox)
- Copy-paste quickstarts that work without modification
- Typed SDKs with IDE autocomplete
- Webhook debugger in dashboard
- Clear error codes (`stream_not_found`, `rate_limited`, `invalid_scope`)

### 5. Production quality

- No pseudocode or `// TODO` in shipped code
- Idempotency for all mutating POST endpoints used by integrations
- Structured logging with `project_id`, `request_id`, `api_key_id`
- Graceful degradation documented in runbooks
- Every public API change is versioned or backward-compatible

---

## System context (what exists)

Read [CURRENT-STATE.md](./CURRENT-STATE.md) before writing code. Key facts:

- **Backend:** Go, chi router, clean architecture, port 8080
- **Frontend:** Next.js 16, features in `talkietalker-stream-web/src/features/`
- **Modes:** `broadcast` (RTMP studio) and `room` (WebRTC meet)
- **Auth today:** User JWT only + internal service token
- **Docs:** `talkietalker-stream-docs/`, OpenAPI at `talkietalker-stream-web/docs/openapi.yaml`

---

## Target capabilities (what we are building)

### Developer identity

- Developer accounts (may overlap with `users` table)
- **Projects** with environment (`sandbox` | `production`)
- **API keys** with scopes: `streams:read`, `streams:write`, `rooms:join`, `webhooks:manage`, etc.
- **Embed tokens** (short-lived JWT) for browser SDK / iframe

### Integration surfaces

| Surface | Consumer | Auth |
|---------|----------|------|
| REST API v1 | Server backends | API key (`Authorization: Bearer sk_...`) |
| WebSocket signaling | Browser / mobile | Embed token or user JWT |
| Webhooks | Server backends | HMAC signature (`X-TalkieTalkerStream-Signature`) |
| `@talkietalker/stream-sdk` etc. | Server backends | API key |
| `@talkietalker/stream-react` | Browser | Embed token from your backend |
| iframe embed | Browser | Signed URL with embed token |

### Events (webhooks)

Minimum event set:

```
stream.created | stream.started | stream.ended
room.participant.joined | room.participant.left
recording.ready | recording.failed
access.granted | subscription.created
chat.message.created (optional, high volume)
```

### Embeddables

- `<TalkieTalkerPlayer streamId={} token={} />` — broadcast viewer
- `<TalkieTalkerRoom roomId={} token={} />` — meet UI (extract from live-room components)
- iframe fallback for non-React stacks

---

## Architecture decisions (pre-approved direction)

See [TARGET-ARCHITECTURE.md](./TARGET-ARCHITECTURE.md) for diagrams. Defaults:

| Decision | Choice | Rationale |
|----------|--------|-----------|
| API versioning | URL prefix `/api/v1` frozen; v2 only for breaking changes | Existing clients |
| API key format | `sk_live_`, `sk_test_`, `pk_live_` (publishable for embed) | Industry convention |
| Webhook delivery | RabbitMQ → worker → HTTP with retries + DLQ | Reuse queue infra |
| SDK generation | OpenAPI → `oapi-codegen` (Go), `openapi-generator` (Node/Python) | Spec is truth |
| Embed auth | Backend mints embed JWT; never expose `sk_` in browser | Security |
| Sandbox | Separate project flag + rate limits; shared infra initially | Cost control |
| Billing for devs | Extend `usage_records` with `api_calls`, `embed_minutes` | Reuse billing |

---

## Execution model

Work in **sprints** defined in [sprints/](./sprints/). Rules:

1. **Complete sprint acceptance criteria** before starting the next
2. **Update OpenAPI** in the same PR as backend changes
3. **Add integration tests** for every new public endpoint
4. **Dogfood** in `talkietalker-stream-web` dashboard (developer settings page)
5. **Document** in `talkietalker-stream-docs/content/developers/` (new section)

### Per-task workflow

For each task in the active sprint:

```
1. Read affected existing code (handler → usecase → repo)
2. State the minimal diff (files, migrations, API shape)
3. Implement backend first, then SDK, then docs, then dashboard UI
4. Add example in talkietalker-stream-docs quickstart
5. Verify: curl / SDK script / embed demo
```

---

## Code standards

### Go

- Idiomatic interfaces; contexts for cancellation
- `fmt.Errorf("scope: action: %w", err)` error wrapping
- New middleware: `AuthenticateAPIKey`, `RequireScope`, `RateLimitByKey`
- Migrations numbered sequentially in `talkietalker-stream-backend/migrations/`

### TypeScript

- Strict mode, no `any`
- SDK packages in new `packages/` workspace (or `stream-sdk/`)
- Extract signaling hooks without breaking `talkietalker-stream-web` imports

### API design

```json
// Success (standardize on this envelope for v1.1+)
{
  "object": "stream",
  "id": "str_...",
  "data": { ... },
  "request_id": "req_..."
}

// Error
{
  "error": {
    "code": "rate_limited",
    "message": "Too many requests",
    "doc_url": "https://docs.talkietalker.stream/errors/rate_limited"
  },
  "request_id": "req_..."
}
```

Migrate wrapped responses gradually; document both during transition.

### Security checklist (every PR)

- [ ] API key never logged in plaintext
- [ ] Embed token TTL ≤ 1 hour
- [ ] Webhook signatures verified with constant-time compare
- [ ] CORS allowlist per project
- [ ] Rate limits on key creation and webhook endpoints
- [ ] Scope enforced at handler, not only middleware

---

## Questions to ask before implementing

If any answer is unknown, **stop and ask**:

1. Which sprint task is in scope? (No scope creep)
2. Is this a server-only or browser-facing surface?
3. Does it need sandbox + production parity?
4. What is the idempotency key header name? (`Idempotency-Key`)
5. Which existing handler/usecase can be extended?
6. What breaks at 10k projects × 1M API calls/day?

---

## Anti-patterns (do not do)

- Building a second signaling server
- Exposing `sk_` keys in frontend bundles
- Per-integrator forks of `use-room-session.ts`
- Undocumented WebSocket message types
- Breaking `talkietalker-stream-web` dashboard without migration path
- Storing webhook secrets in plaintext (hash or encrypt)
- Skipping OpenAPI updates

---

## Reference: competitor mental models

| Platform | What to learn |
|----------|---------------|
| Stripe | API keys, webhooks, idempotency, test mode |
| Twilio | Embed tokens, scoped credentials |
| LiveKit | Room tokens, server SDK, React components |
| Mux | Developer dashboard, clear data model |
| Daily.co | iframe embed, prebuilt UI |

TalkieTalkerStream differentiator: **broadcast (RTMP) + meet (SFU) + monetization** in one platform.

---

## How to use this prompt

**With an AI assistant:**

```
Read these files in order:
1. dev-platform/MASTER-PROMPT.md (this file)
2. dev-platform/CURRENT-STATE.md
3. dev-platform/sprints/sprint-XX-<name>.md

You are executing Sprint XX, Task YY only.
Show your plan before writing code.
```

**With a human team:**

- Tech lead owns [TARGET-ARCHITECTURE.md](./TARGET-ARCHITECTURE.md)
- EM tracks [SPRINT-ROADMAP.md](./SPRINT-ROADMAP.md)
- Engineers pick tasks from active sprint file

---

## Related documents

- [TRANSFORMATION-STRATEGY.md](./TRANSFORMATION-STRATEGY.md) — business and product framing
- [TARGET-ARCHITECTURE.md](./TARGET-ARCHITECTURE.md) — technical end state
- [SPRINT-ROADMAP.md](./SPRINT-ROADMAP.md) — timeline and dependencies
