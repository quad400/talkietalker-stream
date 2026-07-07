# Target Architecture — TalkieTalkerStream Developer Platform

## High-level system diagram

```mermaid
flowchart TB
    subgraph Integrator["Integrator's application"]
        TheirUI[Their web / mobile app]
        TheirBackend[Their backend]
    end

    subgraph SDKs["TalkieTalkerStream SDKs"]
        NodeSDK["@talkietalker/stream-sdk"]
        GoSDK["talkietalker-stream-go"]
        ReactSDK["@talkietalker/stream-react"]
    end

    subgraph ControlPlane["TalkieTalkerStream control plane"]
        DevDash[Developer dashboard]
        Docs[talkietalker-stream-docs]
    end

    subgraph TalkieTalkerStream["TalkieTalkerStream platform"]
        API[REST API /api/v1]
        WS[WebSocket signaling]
        WH[Webhook dispatcher]
        SFU[WebRTC SFU]
        RTMP[RTMP ingest]
        Workers[Background workers]
    end

    subgraph Data["Data & infra"]
        PG[(PostgreSQL)]
        Redis[(Redis)]
        MQ[RabbitMQ]
        S3[(S3)]
    end

    TheirBackend --> NodeSDK --> API
    TheirBackend --> GoSDK --> API
    TheirUI --> ReactSDK --> WS
    TheirBackend -->|mint embed token| API
    ReactSDK -->|embed token| WS

    DevDash --> API
    API --> PG
    WS --> SFU
    API --> MQ --> WH --> TheirBackend
    SFU --> S3
    RTMP --> SFU
    Workers --> MQ
```

---

## Identity & tenancy model

```mermaid
erDiagram
    users ||--o{ projects : owns
    projects ||--o{ api_keys : has
    projects ||--o{ webhook_endpoints : has
    projects ||--o{ streams : contains
    api_keys {
        uuid id PK
        string prefix
        string key_hash
        string environment
        jsonb scopes
        timestamp last_used_at
    }
    projects {
        uuid id PK
        uuid owner_user_id FK
        string name
        string slug
        jsonb allowed_origins
        string environment
    }
```

### Principal types

| Principal | Header / credential | Used by |
|-----------|---------------------|---------|
| `UserPrincipal` | Cookie / `Bearer` JWT | Dashboard, talkietalker-stream-web |
| `APIKeyPrincipal` | `Authorization: Bearer sk_live_...` | Server SDKs, CI |
| `EmbedPrincipal` | `Bearer` embed JWT or query `?token=` | Browser SDK, iframe |
| `ServicePrincipal` | `X-Service-Token` | mediamtx, internal |

### Scope examples

```
streams:read          streams:write         streams:delete
rooms:create          rooms:join            rooms:moderate
recordings:read       webhooks:manage       billing:read
chat:read             chat:write            access:grant
```

---

## Request flow: server integration

```mermaid
sequenceDiagram
    participant App as Integrator backend
    participant SF as TalkieTalkerStream API
    participant DB as PostgreSQL

    App->>SF: POST /streams (Authorization: sk_live_...)
    SF->>SF: Validate key + scope streams:write
    SF->>DB: INSERT stream (project_id)
    SF-->>App: 201 stream object
    SF->>MQ: stream.created event
    Note over SF: Webhook worker delivers to App
```

---

## Request flow: browser embed

```mermaid
sequenceDiagram
    participant User as End user browser
    participant App as Integrator backend
    participant SF as TalkieTalkerStream API
    participant WS as Signaling WS
    participant SFU as SFU

    App->>SF: POST /embed-tokens (sk_live_, room_id, user metadata)
    SF-->>App: embed JWT (1h TTL)
    App-->>User: Render React SDK with token
    User->>WS: connect /api/v1/ws?token=embed_jwt
    WS->>WS: Validate embed token + project CORS
    User->>WS: join_room
    WS->>SFU: AddPeer
    SFU-->>User: WebRTC media
```

**Critical:** `sk_live_` never touches the browser.

---

## Webhook architecture

```mermaid
flowchart LR
    UC[Usecase emits domain event] --> Outbox[(Outbox table / MQ)]
    Outbox --> Worker[Webhook worker]
    Worker --> Sign[HMAC sign payload]
    Sign --> HTTP[POST integrator URL]
    HTTP -->|2xx| Done[Mark delivered]
    HTTP -->|fail| Retry[Exponential backoff]
    Retry --> DLQ[Dead letter queue]
```

### Webhook payload shape

```json
{
  "id": "evt_01H...",
  "type": "stream.started",
  "created_at": "2026-06-29T12:00:00Z",
  "project_id": "proj_...",
  "data": {
    "object": "stream",
    "id": "str_...",
    "status": "live"
  }
}
```

Headers:

```
X-TalkieTalkerStream-Signature: t=...,v1=...
X-TalkieTalkerStream-Event-Id: evt_01H...
```

---

## Package layout (target)

```
stream/                          # monorepo root
├── talkietalker-stream-backend/              # unchanged core + new handlers
├── talkietalker-stream-web/                  # dashboard + dogfooding
├── talkietalker-stream-docs/                 # + content/developers/
├── packages/                    # NEW
│   ├── talkietalker-stream-node/           # @talkietalker/stream-sdk + @talkietalker/stream-react
│   ├── talkietalker-stream-go/           # Go SDK module
│   └── streamflow-python/       # optional Sprint 04+
├── examples/                    # NEW
│   ├── node-quickstart/
│   ├── react-embed-room/
│   └── webhook-receiver/
└── dev-platform/                # these guides
```

---

## API versioning strategy

| Version | Policy |
|---------|--------|
| `v1` (current) | Maintain backward compatibility; additive changes only |
| `v1.1` | Standardized error envelope + `request_id` (optional header) |
| `v2` | Breaking changes only if unavoidable; 12-month deprecation |

New developer resources use consistent object prefixes:

| Object | ID prefix |
|--------|-----------|
| Project | `proj_` |
| API key | `key_` (secret: `sk_live_`, `sk_test_`) |
| Stream | `str_` (or keep UUID) |
| Webhook endpoint | `wh_` |
| Event | `evt_` |

---

## Sandbox vs production

| Dimension | Sandbox (`sk_test_`) | Production (`sk_live_`) |
|-----------|----------------------|-------------------------|
| Data isolation | Logical (`project.environment`) | Logical |
| Rate limits | 100 req/min | Plan-based |
| Webhook delivery | Real HTTP, flagged `livemode: false` | Real HTTP |
| SFU / media | Shared infra, max 10 viewers/room | Full limits |
| Billing | No charge | Metered |

---

## Security boundaries

```mermaid
flowchart TB
    subgraph Public["Internet"]
        Browser[Browser]
        Integrator[Integrator server]
    end

    subgraph Edge["TalkieTalkerStream edge"]
        API[API + WSS]
        RL[Rate limiter]
        CORS[CORS per project]
    end

    subgraph Private["Private network"]
        SFU[SFU]
        RTMP[mediamtx]
        Workers[Workers]
    end

    Browser -->|embed JWT only| API
    Integrator -->|sk_*| API
    API --> RL --> CORS
    API --> SFU
    API --> Workers
```

---

## Observability (Sprint 10)

| Signal | Labels |
|--------|--------|
| API latency histogram | `project_id`, `route`, `status` |
| Webhook delivery | `endpoint_id`, `event_type`, `attempt` |
| SFU sessions | `project_id`, `mode` |
| API key usage | `key_id` (hashed), `scope` |

Expose **request logs** in developer dashboard (last 7 days, sandbox + production).

---

## Migration path for existing users

Existing `users` and `streams` without `project_id`:

1. Sprint 02 migration creates default project per user: `"Default project"`
2. Backfill `streams.project_id` from `streams.user_id`
3. Dashboard continues via JWT → implicit default project
4. Integrators create explicit projects + keys

No breaking change for current SaaS users.
