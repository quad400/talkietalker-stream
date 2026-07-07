# API Envelope RFC — TalkieTalkerStream v1 / v1.1

Status: **Accepted** (Sprint 00)  
Scope: REST JSON responses from `talkietalker-stream-backend`

---

## v1 (frozen — no breaking changes)

Existing clients and `talkietalker-stream-web` depend on these shapes. Sprint 00 and Sprint 01 must not break them.

### Success — wrapped

Used by: Auth, Streams, Destinations, Chat, Tiers, Subscriptions, Notifications (most operations).

```json
{
  "status": 200,
  "message": "stream created",
  "data": { }
}
```

### Success — direct

Used by: Billing, Recordings, Access Grants, Stream Health, Ingest webhooks.

```json
{
  "id": "...",
  "field": "value"
}
```

Or paginated lists without outer `status` wrapper.

### Error — v1

Produced by `httputil.Error` and aligned auth middleware:

```json
{
  "status": 401,
  "error": "unauthorized",
  "code": "unauthorized",
  "request_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Sprint 00 additive change:** `code` and `request_id` are optional fields appended to the existing `{ status, error }` shape. Clients that only read `error` continue to work.

### HTTP status codes

| Code | Typical `error` / `code` |
|------|--------------------------|
| 400 | validation_error |
| 401 | unauthorized |
| 402 | payment_required |
| 403 | forbidden |
| 404 | not_found |
| 409 | conflict |
| 429 | rate_limited |
| 500 | internal_error |

---

## v1.1 (additive — future developer platform endpoints)

New resources (projects, API keys, webhooks, embed tokens) SHOULD use:

### Success

```json
{
  "object": "stream",
  "id": "str_...",
  "data": { },
  "request_id": "req_..."
}
```

Existing v1 endpoints are **not** migrated unless explicitly versioned.

### Error (structured)

```json
{
  "error": {
    "code": "rate_limited",
    "message": "Too many requests",
    "doc_url": "https://docs.talkietalker.stream/developers/errors#rate_limited"
  },
  "request_id": "req_..."
}
```

Dual error shapes may coexist during transition. SDKs must:

1. Prefer `error.code` when present
2. Fall back to string `error` field
3. Always surface `request_id` in exception messages for support

---

## WebSocket envelope

Signaling and chat WebSockets use:

```json
{
  "type": "join_room",
  "payload": { },
  "correlation_id": "optional-client-id"
}
```

Errors:

```json
{
  "type": "error",
  "payload": {
    "code": "room_unavailable",
    "message": "room is not live"
  }
}
```

---

## Headers

| Header | Direction | Purpose |
|--------|-----------|---------|
| `X-Request-ID` | response | Correlates logs and support tickets |
| `Authorization: Bearer` | request | JWT (dashboard) or API key (future) |
| `Idempotency-Key` | request | Future mutating POST dedup (Sprint 04) |

---

## Decision log

| Date | Decision |
|------|----------|
| Sprint 00 | Keep wrapped/direct mix for v1 |
| Sprint 00 | Add `request_id` + `code` to errors without removing `error` string |
| Sprint 01+ | New developer resources use v1.1 envelope where practical |
