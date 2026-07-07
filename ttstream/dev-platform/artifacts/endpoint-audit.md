# Endpoint Audit — TalkieTalkerStream API

Generated during Sprint 00. Paths are full URL paths as registered on the chi router.

## Summary

| Metric | Count |
|--------|-------|
| REST routes | 78 |
| WebSocket routes | 2 |
| OpenAPI gaps (pre-fix) | 4 |
| Internal-only | 4 |

## Health

| Method | Path | Auth | Response | Visibility | OpenAPI |
|--------|------|------|----------|------------|---------|
| GET | `/health` | none | direct | public | ok |

## Auth (`/api/v1/auth`)

| Method | Path | Auth | Response | Visibility | OpenAPI |
|--------|------|------|----------|------------|---------|
| POST | `/api/v1/auth/register` | none | wrapped | public | ok |
| POST | `/api/v1/auth/login` | none | wrapped | public | ok |
| POST | `/api/v1/auth/refresh` | none | wrapped | public | ok |
| POST | `/api/v1/auth/verify-email` | none | wrapped | public | ok |
| POST | `/api/v1/auth/logout` | JWT | wrapped | dashboard | ok |
| GET | `/api/v1/auth/me` | JWT | wrapped | dashboard | ok |

## Streams (`/api/v1/streams`)

| Method | Path | Auth | Response | Visibility | OpenAPI |
|--------|------|------|----------|------------|---------|
| GET | `/api/v1/streams/live` | none | direct | public | ok |
| GET | `/api/v1/streams/{id}` | none | wrapped | public | ok |
| GET | `/api/v1/streams/{id}/watch` | optional JWT | wrapped | public | ok |
| POST | `/api/v1/streams` | JWT | wrapped | dashboard | ok |
| GET | `/api/v1/streams` | JWT | wrapped | dashboard | ok |
| PATCH | `/api/v1/streams/{id}` | JWT | wrapped | dashboard | ok |
| DELETE | `/api/v1/streams/{id}` | JWT | wrapped | dashboard | ok |
| POST | `/api/v1/streams/{id}/start` | JWT | wrapped | dashboard | ok |
| POST | `/api/v1/streams/{id}/stop` | JWT | wrapped | dashboard | ok |
| POST | `/api/v1/streams/{id}/rotate-key` | JWT | wrapped | dashboard | ok |

## Destinations (`/api/v1/streams/{stream_id}/destinations`)

| Method | Path | Auth | Response | Visibility | OpenAPI |
|--------|------|------|----------|------------|---------|
| POST | `.../destinations` | JWT | wrapped | dashboard | ok |
| GET | `.../destinations` | JWT | wrapped | dashboard | ok |
| GET | `.../destinations/{id}` | JWT | wrapped | dashboard | ok |
| PATCH | `.../destinations/{id}` | JWT | wrapped | dashboard | ok |
| DELETE | `.../destinations/{id}` | JWT | wrapped | dashboard | ok |
| POST | `.../destinations/{id}/test` | JWT | wrapped | dashboard | ok |
| POST | `.../destinations/{id}/enable` | JWT | wrapped | dashboard | ok |
| POST | `.../destinations/{id}/disable` | JWT | wrapped | dashboard | ok |

## Access grants (`/api/v1/streams/{stream_id}/access`)

| Method | Path | Auth | Response | Visibility | OpenAPI |
|--------|------|------|----------|------------|---------|
| POST | `.../access/purchase` | JWT | direct | dashboard | ok |
| GET | `.../access/check` | JWT | direct | dashboard | ok |
| GET | `.../access` | JWT | direct | dashboard | ok |
| POST | `.../access/comp` | JWT | direct | dashboard | ok |
| DELETE | `.../access/{grant_id}` | JWT | direct | dashboard | ok |

## Chat (`/api/v1/streams/{stream_id}/chat`)

| Method | Path | Auth | Response | Visibility | OpenAPI |
|--------|------|------|----------|------------|---------|
| GET | `.../chat/ws` | JWT / guest | WS | public | ok |
| POST | `.../chat/guest-session` | none | wrapped | public | **missing** |
| GET | `.../chat/history` | JWT | wrapped | dashboard | ok |
| DELETE | `.../chat/messages/{message_id}` | JWT | wrapped | dashboard | ok |
| POST | `.../chat/messages/{message_id}/pin` | JWT | wrapped | dashboard | **missing** |
| DELETE | `.../chat/messages/{message_id}/pin` | JWT | wrapped | dashboard | **missing** |
| POST | `.../chat/ban/{user_id}` | JWT | wrapped | dashboard | ok |
| DELETE | `.../chat/ban/{user_id}` | JWT | wrapped | dashboard | ok |
| GET | `.../chat/moderators` | JWT | wrapped | dashboard | ok |
| POST | `.../chat/moderators` | JWT | wrapped | dashboard | ok |
| DELETE | `.../chat/moderators/{moderator_id}` | JWT | wrapped | dashboard | ok |

## Stream health (`/api/v1/streams/{stream_id}/health`)

| Method | Path | Auth | Response | Visibility | OpenAPI |
|--------|------|------|----------|------------|---------|
| GET | `.../health` | JWT | direct | dashboard | ok |
| GET | `.../health/history` | JWT | direct | dashboard | ok |
| POST | `.../health/snapshot` | service token | direct | internal | ok |

## Billing (`/api/v1/billing`)

| Method | Path | Auth | Response | Visibility | OpenAPI |
|--------|------|------|----------|------------|---------|
| GET | `/api/v1/billing/account` | JWT | direct | dashboard | ok |
| PATCH | `/api/v1/billing/account` | JWT | direct | dashboard | ok |
| GET | `/api/v1/billing/usage/summary` | JWT | direct | dashboard | ok |
| GET | `/api/v1/billing/usage` | JWT | direct | dashboard | ok |
| GET | `/api/v1/billing/invoices` | JWT | direct | dashboard | ok |
| GET | `/api/v1/billing/invoices/{id}` | JWT | direct | dashboard | ok |
| GET | `/api/v1/billing/payment-methods` | JWT | direct | dashboard | ok |
| POST | `/api/v1/billing/payment-methods` | JWT | direct | dashboard | ok |
| PATCH | `/api/v1/billing/payment-methods/{id}/default` | JWT | direct | dashboard | ok |
| DELETE | `/api/v1/billing/payment-methods/{id}` | JWT | direct | dashboard | ok |
| POST | `/api/v1/billing/payment-methods/{id}/pay-invoice/{invoice_id}` | JWT | direct | dashboard | ok |

## Recordings (`/api/v1/recordings`)

| Method | Path | Auth | Response | Visibility | OpenAPI |
|--------|------|------|----------|------------|---------|
| GET | `/api/v1/recordings` | JWT | direct | dashboard | ok |
| GET | `/api/v1/recordings/stream/{stream_id}` | JWT | direct | dashboard | ok |
| GET | `/api/v1/recordings/{id}` | JWT | direct | dashboard | ok |
| GET | `/api/v1/recordings/{id}/download` | JWT | direct | dashboard | ok |
| PATCH | `/api/v1/recordings/{id}` | JWT | direct | dashboard | ok |
| DELETE | `/api/v1/recordings/{id}` | JWT | direct | dashboard | ok |

## Tiers (`/api/v1/tiers`)

| Method | Path | Auth | Response | Visibility | OpenAPI |
|--------|------|------|----------|------------|---------|
| GET | `/api/v1/tiers/channel/{username}` | none | wrapped | public | ok |
| GET | `/api/v1/tiers/{id}` | none | wrapped | public | ok |
| POST | `/api/v1/tiers` | JWT | wrapped | dashboard | ok |
| GET | `/api/v1/tiers` | JWT | wrapped | dashboard | ok |
| PATCH | `/api/v1/tiers/{id}` | JWT | wrapped | dashboard | ok |
| DELETE | `/api/v1/tiers/{id}` | JWT | wrapped | dashboard | ok |

## Subscriptions (`/api/v1/subscriptions`)

| Method | Path | Auth | Response | Visibility | OpenAPI |
|--------|------|------|----------|------------|---------|
| POST | `/api/v1/subscriptions` | JWT | wrapped | dashboard | ok |
| GET | `/api/v1/subscriptions` | JWT | wrapped | dashboard | ok |
| GET | `/api/v1/subscriptions/channel/{channel_user_id}` | JWT | wrapped | dashboard | ok |
| DELETE | `/api/v1/subscriptions/{id}` | JWT | wrapped | dashboard | ok |

## Notifications (`/api/v1/notifications`)

| Method | Path | Auth | Response | Visibility | OpenAPI |
|--------|------|------|----------|------------|---------|
| GET | `/api/v1/notifications` | JWT | wrapped | dashboard | ok |
| DELETE | `/api/v1/notifications` | JWT | wrapped | dashboard | ok |
| GET | `/api/v1/notifications/unread-count` | JWT | wrapped | dashboard | ok |
| POST | `/api/v1/notifications/read-all` | JWT | wrapped | dashboard | ok |
| GET | `/api/v1/notifications/preferences` | JWT | wrapped | dashboard | ok |
| PATCH | `/api/v1/notifications/preferences` | JWT | wrapped | dashboard | ok |
| PATCH | `/api/v1/notifications/{id}/read` | JWT | wrapped | dashboard | ok |
| DELETE | `/api/v1/notifications/{id}` | JWT | wrapped | dashboard | ok |

## Audit logs (`/api/v1/audit-logs`)

| Method | Path | Auth | Response | Visibility | OpenAPI |
|--------|------|------|----------|------------|---------|
| GET | `/api/v1/audit-logs` | JWT admin | wrapped | internal | ok |
| GET | `/api/v1/audit-logs/{id}` | JWT admin | wrapped | internal | ok |

## Ingest (`/internal`)

| Method | Path | Auth | Response | Visibility | OpenAPI |
|--------|------|------|----------|------------|---------|
| POST | `/internal/mediamtx/auth` | mediamtx | direct | internal | ok |
| POST | `/internal/stream-started` | service token | direct | internal | ok |
| POST | `/internal/stream-stopped` | service token | direct | internal | ok |

## Signaling

| Method | Path | Auth | Response | Visibility | OpenAPI |
|--------|------|------|----------|------------|---------|
| GET | `/api/v1/ws` | optional JWT | WS | public | ok (partial messages) |
| GET | `/watch/demo` | none | HTML | public | ok |
| GET | `/watch/diagnostic` | none | HTML | public | **missing** |
| GET | `/room/demo` | none | HTML | public | ok |

## OpenAPI gaps to fix (Sprint 00)

1. ~~`POST /api/v1/streams/{stream_id}/chat/guest-session`~~ fixed
2. ~~`POST /api/v1/streams/{stream_id}/chat/messages/{message_id}/pin`~~ fixed
3. ~~`DELETE /api/v1/streams/{stream_id}/chat/messages/{message_id}/pin`~~ fixed
4. ~~`GET /watch/diagnostic`~~ fixed
5. `/api/v1/ws` — message catalog expanded in OpenAPI + `developers/signaling-protocol.mdx`

## Response shape reference

| Shape | Fields | Used by |
|-------|--------|---------|
| wrapped | `{ status, message, data }` | auth, streams, destinations, chat, tiers, subscriptions, notifications |
| direct | resource object or list | billing, recordings, access grants, health, ingest |
