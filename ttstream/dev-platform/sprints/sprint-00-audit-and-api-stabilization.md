# Sprint 00 — Audit & API Stabilization

**Duration:** 2 weeks  
**Goal:** Establish a contract-stable, documented API surface that SDKs and integrators can rely on.  
**Depends on:** —  
**Blocks:** Sprint 01

---

## Objectives

1. Complete inventory of public vs internal endpoints
2. Fix inconsistencies in OpenAPI vs implementation
3. Define error code catalog and `request_id` propagation
4. Document WebSocket message schemas
5. Add API integration test harness

---

## Tasks

### Task 00.1 — Endpoint audit matrix

**Estimate:** 3 pts  
**Owner:** Staff engineer

| # | Action | Acceptance criteria |
|---|--------|-------------------|
| 1 | Grep all `RegisterRoutes` in `talkietalker-stream-backend/internal/handler/` | Spreadsheet/MD table: method, path, auth, response shape |
| 2 | Compare to `talkietalker-stream-web/docs/openapi.yaml` | List gaps: missing paths, wrong schemas |
| 3 | Classify each endpoint: `public`, `dashboard`, `internal` | Tag in OpenAPI `x-visibility` extension |

**Output file:** `dev-platform/artifacts/endpoint-audit.md` (create during sprint)

---

### Task 00.2 — OpenAPI reconciliation

**Estimate:** 5 pts  
**Owner:** Backend engineer

- [ ] Every `public` endpoint documented in OpenAPI
- [ ] WebSocket section expanded: all `join_room` message types from `signaling/messages.go`
- [ ] `components/schemas` include `Stream`, `StreamDetail`, `WatchResponse`, `Error`
- [ ] Add `x-changelog` note for upcoming developer resources
- [ ] CI job: `openapi-diff` or spectral lint on PR

**Files:** `talkietalker-stream-web/docs/openapi.yaml`, `.github/workflows/` (if exists)

---

### Task 00.3 — Error catalog

**Estimate:** 3 pts  
**Owner:** Staff engineer

Define stable error codes in `talkietalker-stream-docs/content/developers/errors.mdx` (stub OK):

| Code | HTTP | When |
|------|------|------|
| `unauthorized` | 401 | Missing/invalid auth |
| `forbidden` | 403 | Valid auth, insufficient scope |
| `not_found` | 404 | Resource missing |
| `payment_required` | 402 | Paid stream, no grant |
| `rate_limited` | 429 | Too many requests |
| `validation_error` | 400 | Bad input |
| `conflict` | 409 | Idempotency or state conflict |
| `internal_error` | 500 | Unexpected |

- [ ] Add `request_id` middleware in `internal/handler/middleware/`
- [ ] Return `request_id` in all error JSON responses
- [ ] Log `request_id` in zap logger context

---

### Task 00.4 — Response envelope decision

**Estimate:** 2 pts  
**Owner:** Staff engineer

Document decision in `dev-platform/artifacts/api-envelope-rfc.md`:

- **v1 (frozen):** Keep existing wrapped/direct mix
- **v1.1 (additive):** New endpoints return `{ object, id, data, request_id }`
- SDK must handle both via unwrap helper

No breaking changes in this sprint.

---

### Task 00.5 — WebSocket protocol document

**Estimate:** 5 pts  
**Owner:** Backend + frontend engineer

- [ ] Export signaling types from `talkietalker-stream-backend/internal/handler/signaling/messages.go` to MDX table
- [ ] Cross-reference `talkietalker-stream-web/src/features/signaling/types.ts`
- [ ] Document connection lifecycle: auth → join/join_room → offer/answer → ICE → reconnect
- [ ] Publish at `talkietalker-stream-docs/content/developers/signaling-protocol.mdx`

---

### Task 00.6 — Integration test harness

**Estimate:** 5 pts  
**Owner:** Backend engineer

- [ ] `talkietalker-stream-backend/tests/integration/` or `test/api_test.go` with testcontainers (Postgres, Redis, RabbitMQ)
- [ ] Tests: health, register/login, create stream, start/stop
- [ ] Makefile target: `make test-integration`
- [ ] Document in `talkietalker-stream-backend/README.md`

---

## Implementation prompt

```
You are executing Sprint 00 of the TalkieTalkerStream developer platform conversion.

Read:
- dev-platform/CURRENT-STATE.md
- dev-platform/sprints/sprint-00-audit-and-api-stabilization.md
- talkietalker-stream-web/docs/openapi.yaml
- talkietalker-stream-backend/internal/server/server.go

Task: Complete Task 00.2 — reconcile OpenAPI with implemented handlers.

Rules:
- Do not add API keys or new features yet
- Add x-visibility tags: public | dashboard | internal
- Expand WebSocket documentation from signaling/messages.go
- Add request_id middleware without breaking existing response shapes

Show the gap list first, then implement fixes.
```

---

## Demo script

```bash
# 1. Lint OpenAPI
npx @redocly/cli lint talkietalker-stream-web/docs/openapi.yaml

# 2. Integration tests
cd talkietalker-stream-backend && make test-integration

# 3. Spot-check request_id
curl -v http://localhost:8080/api/v1/streams/live 2>&1 | grep -i request
```

---

## Risks

| Risk | Mitigation |
|------|------------|
| OpenAPI drift is large | Prioritize public endpoints only |
| WebSocket docs stale quickly | Generate from Go structs in CI (future) |

---

## Retro questions

1. How many endpoints were undocumented?
2. Is the response envelope RFC clear enough for SDK design?
3. Is integration test setup fast enough for local dev?

**Next sprint:** [Sprint 01 — Developer identity & API keys](./sprint-01-developer-identity-and-api-keys.md)
