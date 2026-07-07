# Current State Audit — TalkieTalkerStream (as built)

> Inventory of production capabilities **today**. Use this as the baseline when scoping developer-platform work. Paths are relative to the monorepo root.

---

## Monorepo packages

| Package | Path | Role |
|---------|------|------|
| Backend API + SFU | `talkietalker-stream-backend/` | Go REST, WebSocket signaling, SFU, workers |
| Dashboard & marketing | `talkietalker-stream-web/` | Next.js 16 app, live UI, API proxy |
| Documentation site | `talkietalker-stream-docs/` | MDX docs, proxied at `/docs` |

---

## Backend architecture

### Entry points

| Binary | Path | Purpose |
|--------|------|---------|
| API server | `talkietalker-stream-backend/cmd/api/main.go` | HTTP API, signaling hub, chat hub, background publishers |
| Worker | `talkietalker-stream-backend/cmd/worker/main.go` | Restream, subscriptions, billing aggregation |

### Layering

```
internal/handler/     → HTTP + WebSocket handlers
internal/usecase/     → Business logic
internal/domain/      → Entities & repository interfaces
internal/repository/  → Postgres implementations
internal/sfu/         → Pion WebRTC SFU
internal/worker/      → Async jobs
pkg/                  → jwt, redis, queue, storage, logger
```

### Infrastructure dependencies

| Service | Usage |
|---------|-------|
| PostgreSQL | All persistent state (21 migrations) |
| Redis | Chat pub/sub, viewer stats, meeting presence |
| RabbitMQ | Async jobs, outbox, restream tasks |
| S3-compatible storage | Recordings, room capture uploads |
| mediamtx (RTMP) | Broadcast ingest via internal webhooks |

### Authentication (today)

- **JWT access + refresh tokens** (`pkg/jwt`, `internal/handler/auth`)
- Cookie-based session from Next.js proxy (`talkietalker-stream-web/src/lib/proxy-auth.ts`)
- **Internal service token** for mediamtx and health snapshots (`X-Service-Token`)
- **No API keys, no OAuth for third-party apps, no tenant/project model**

---

## REST API surface (implemented)

Base: `/api/v1` — full spec in `talkietalker-stream-web/docs/openapi.yaml`.

| Domain | Handler | Key capabilities |
|--------|---------|------------------|
| Auth | `internal/handler/auth` | register, login, refresh, logout, me, verify-email |
| Streams | `internal/handler/stream` | CRUD, start/stop, rotate-key, watch, list-live |
| Destinations | `internal/handler/destination` | Multistream RTMP targets per stream |
| Access grants | `internal/handler/accessgrant` | Purchase, comp, check, revoke paid access |
| Billing | `internal/handler/billing` | Account, usage, invoices, payment methods |
| Recordings | `internal/handler/recording` | List, download, manage VODs |
| Tiers | `internal/handler/tier` | Fan subscription tier CRUD |
| Subscriptions | `internal/handler/channelsubscription` | Channel subscriptions |
| Chat | `internal/handler/chat` | History, moderation, guest sessions |
| Notifications | `internal/handler/notification` | In-app notifications |
| Stream health | `internal/handler/streamhealth` | Quality snapshots |
| Audit logs | `internal/handler/auditlog` | Admin audit trail |
| Ingest | `internal/handler/ingest` | mediamtx auth, stream started/stopped |
| Signaling (HTTP) | `internal/handler/signaling` | Demo pages only |

### Stream modes

| `mode` | Product name | Ingest | Playback |
|--------|--------------|--------|----------|
| `broadcast` | Studio | RTMP (OBS) | WebRTC viewer / HLS path via transcoder |
| `room` | Meet | Browser WebRTC (SFU) | Peer mesh via SFU |

Defined in migration `000014_add_stream_mode`, frontend `talkietalker-stream-web/src/features/streams/types.ts`.

---

## WebSocket surfaces (implemented)

| Endpoint | Handler | Purpose |
|----------|---------|---------|
| `/api/v1/ws` | `signaling/handler.go` | WebRTC signaling: `join` (broadcast viewer), `join_room` (meet) |
| `/api/v1/streams/{id}/chat/ws` | `chat/handler.go` | Real-time chat |

### Signaling capabilities (room mode)

Implemented in `internal/handler/signaling/` + `internal/usecase/meeting/`:

- Join / leave / reconnect with disconnect grace period
- Waiting room & guest admission
- Host/moderator/guest roles & permissions
- Room settings (polls, Q&A, breakouts flags)
- Screen share, mute, hand raise, reactions
- Server-side room recording → S3
- Engagement tracking (`000018_meeting_engagement`)
- Large meeting mode (`MeetingMode: interactive | large`)

Frontend mirror: `talkietalker-stream-web/src/features/signaling/` (~2.2k lines in `use-room-session.ts`).

---

## SFU (`internal/sfu/`)

| Session type | Use case |
|--------------|----------|
| `broadcastSession` | One-to-many RTMP-sourced viewing |
| `roomSession` | Small WebRTC conferences |
| `largeMeetingSession` | Higher-capacity rooms |
| `roomRecordingCapture` | Server-side room recording |

Pion WebRTC, configurable via `WebRTCConfig` in `internal/config/config.go`.

---

## Workers & async

| Worker | Path | Role |
|--------|------|------|
| Outbox publisher | `internal/worker/` | Reliable event dispatch via RabbitMQ |
| Meeting recovery | `internal/worker/meeting_recovery.go` | Reconcile stale meeting state |
| Stream worker | `cmd/worker` | Restream FFmpeg forks, billing |
| Subscription worker | `internal/worker/subscription_worker.go` | Fan subscription lifecycle |

---

## Frontend (`talkietalker-stream-web`)

### Stack

Next.js 16, React 19, TanStack Query, Zustand, Tailwind 4, shadcn/radix.

### App routes (high level)

| Area | Path pattern |
|------|--------------|
| Marketing | `/` |
| Auth | `/login`, `/register`, `/auth/*` |
| Dashboard | `/dashboard/*` |
| Studio live | `/dashboard/streams/studio/[id]/live` |
| Meet live | `/dashboard/streams/meet/[id]/live` |
| Public watch | `/watch/[id]` |

### Feature modules (`src/features/`)

| Module | Backend coupling |
|--------|------------------|
| `auth` | JWT via cookie proxy |
| `streams` | REST CRUD + lifecycle |
| `signaling` | WebSocket + WebRTC |
| `chat` | REST + WebSocket |
| `recordings` | REST + S3 playback |
| `billing` | REST |
| `subscriptions`, `tiers` | REST |
| `access-grants` | REST |
| `destinations` | REST |
| `stream-health` | REST |
| `notifications` | REST |
| `stage-recording` | Client-side compositor |
| `stage-overlay` | Reactions, captions, chat overlay |

### API client pattern

- Browser → same-origin `/api/v1/*` proxy → Go backend
- `src/lib/http.ts` — auto-refresh on 401
- `src/lib/proxy-auth.ts` — cookie sync for auth

---

## Database entities (migrations 001–021)

| Group | Tables / concepts |
|-------|-------------------|
| Identity | users, oauth_providers, tokens |
| Streaming | streams, stream_destinations, stream_access_grants, stream_health |
| Meetings | meeting participants, engagement, recording state, guest permissions, room flags |
| Monetization | billing_accounts, usage_records, invoices, payment_methods, subscription_tiers, channel_subscriptions |
| Engagement | chat_messages, chat_moderators, notifications |
| Ops | audit_logs |

---

## Documentation (today)

| Asset | Location | Coverage |
|-------|----------|----------|
| MDX guides | `talkietalker-stream-docs/content/` | Product + partial API reference |
| OpenAPI 3.1 | `talkietalker-stream-web/docs/openapi.yaml` | ~5k lines, Phase 1 REST |
| Feature READMEs | `talkietalker-stream-web/src/features/*/README.md` | Internal frontend module notes |

---

## What is NOT built (developer-platform gaps)

Use this list to prioritize sprints:

| Gap | Impact on third-party developers |
|-----|----------------------------------|
| No API keys / client credentials | Cannot authenticate server-to-server |
| No projects / tenants | All resources tied to user accounts only |
| No scoped permissions | JWT is all-or-nothing per user |
| No webhooks | Cannot react to stream/room events in external systems |
| No embed SDK / npm packages | Must reimplement `use-room-session` |
| No iframe / widget host | No drop-in player or room |
| No idempotency keys | Unsafe for automated integrations |
| No rate limiting per client | Abuse risk at scale |
| No sandbox environment | Hard to test without production keys |
| No developer dashboard | Keys, logs, webhooks managed only via API (which doesn't exist yet) |
| Response format inconsistency | Wrapped vs direct responses (documented but friction) |
| Signaling auth tied to user JWT | Guest flows exist; no signed embed tokens for arbitrary sites |

---

## Reuse assets for developer platform

| Existing asset | Reuse as |
|----------------|----------|
| OpenAPI spec | Source of truth for SDK generation |
| `use-room-session.ts` | Extract into `@talkietalker/stream-react-rooms` |
| SFU + signaling hub | Unchanged core; add embed token validation |
| Access grant logic | Expose via API key for programmatic gating |
| Billing / usage_records | Extend metrics for API calls & viewer minutes |
| talkietalker-stream-docs | Expand Developer Reference section |
| Next.js proxy pattern | Reference for CORS-safe browser integrations |
