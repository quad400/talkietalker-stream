# Sprint 02 — Tenant Isolation & Scopes

**Duration:** 2 weeks  
**Goal:** Every stream, recording, and webhook resource is scoped to a project; scope enforcement is consistent.  
**Depends on:** Sprint 01  
**Blocks:** Sprint 03, 05

---

## Objectives

1. Add `project_id` to `streams` and related tables
2. Backfill default project for existing users
3. Enforce `project_id` in all repository queries
4. Embed token minting endpoint for browser clients
5. Scope matrix enforced on all public endpoints

---

## Tasks

### Task 02.1 — Schema migration

**Estimate:** 5 pts

```sql
ALTER TABLE streams ADD COLUMN project_id UUID REFERENCES projects(id);
-- backfill: SET project_id = (SELECT id FROM projects WHERE owner_user_id = streams.user_id LIMIT 1)
CREATE INDEX idx_streams_project_id ON streams(project_id);
```

- [ ] Same for `recordings` (via stream join or denormalized column)
- [ ] Migration is idempotent-safe with transaction
- [ ] NOT NULL constraint after backfill

---

### Task 02.2 — Default project backfill job

**Estimate:** 3 pts

- [ ] One-time migration: create `Default` project per user without projects
- [ ] Assign all orphan streams to default project
- [ ] Dashboard JWT requests resolve implicit `default` project when `project_id` omitted

---

### Task 02.3 — Repository query hardening

**Estimate:** 8 pts

Audit and fix every query in:

- `internal/repository/postgres/stream/`
- `internal/repository/postgres/recording/`
- `internal/repository/postgres/destination/`
- `internal/repository/postgres/accessgrant/`

**Rule:** API key requests MUST filter `WHERE project_id = $principal.ProjectID`. JWT dashboard requests filter `WHERE user_id = $user OR project.owner_user_id = $user`.

- [ ] Add integration test: key A cannot read key B's stream
- [ ] Add SQL review checklist to PR template

---

### Task 02.4 — Scope enforcement matrix

**Estimate:** 5 pts

Document and implement in middleware or per-handler:

| Endpoint | Required scope |
|----------|----------------|
| `POST /streams` | `streams:write` |
| `GET /streams` | `streams:read` |
| `POST /streams/{id}/start` | `streams:write` |
| `GET /recordings` | `recordings:read` |
| `POST /streams/{id}/access/comp` | `access:grant` |
| `GET /api/v1/ws` (room) | `rooms:join` (embed token) |

---

### Task 02.5 — Embed token endpoint

**Estimate:** 8 pts

`POST /api/v1/embed-tokens` (API key auth, scope `rooms:join` or `streams:read`)

Request:

```json
{
  "resource_type": "room",
  "resource_id": "uuid",
  "participant": {
    "name": "Jane",
    "role": "guest",
    "user_id": "optional-external-id"
  },
  "ttl_seconds": 3600
}
```

Response:

```json
{
  "token": "eyJ...",
  "expires_at": "..."
}
```

- [ ] JWT claims: `project_id`, `resource_id`, `participant`, `scopes`
- [ ] Signaling handler accepts embed JWT in addition to user JWT
- [ ] Validate CORS `allowed_origins` on project when connecting via embed token

Files: `pkg/jwt/embed.go`, `internal/handler/embed/handler.go`, update `signaling/handler.go`

---

### Task 02.6 — Publishable keys (optional stretch)

**Estimate:** 3 pts

- [ ] `pk_test_` / `pk_live_` keys with read-only scopes for client-side config (no secret operations)
- [ ] Defer if time-constrained

---

## Implementation prompt

```
Sprint 02 — Tenant isolation.

1. Migration: add project_id to streams, backfill from default projects
2. Update stream repository List/Get to require project_id for APIKeyPrincipal
3. Implement POST /api/v1/embed-tokens
4. Update signaling WebSocket auth to validate embed JWT

Security test required: two projects, two API keys — cross-tenant access must 404 not 403 (don't leak existence).

Reference: dev-platform/TARGET-ARCHITECTURE.md embed flow diagram.
```

---

## Acceptance criteria

- [ ] Cross-tenant stream access returns 404
- [ ] Embed token allows `join_room` without user account
- [ ] Existing dashboard users see all streams in default project
- [ ] Scope `streams:read` alone cannot start streams

---

## Demo script

```bash
# Mint embed token with sk_live_
EMBED=$(curl -s -X POST localhost:8080/api/v1/embed-tokens \
  -H "Authorization: Bearer $SK" \
  -d '{"resource_type":"room","resource_id":"'$ROOM_ID'","participant":{"name":"Guest"}}' \
  | jq -r '.token')

# Connect WebSocket (wscat)
wscat -c "ws://localhost:8080/api/v1/ws?token=$EMBED"
# send: {"type":"join_room","room_id":"..."}
```

**Next:** [Sprint 03 — Webhooks & events](./sprint-03-webhooks-and-events.md)
