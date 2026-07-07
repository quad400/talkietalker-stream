# Sprint 01 — Developer Identity & API Keys

**Duration:** 2 weeks  
**Goal:** Developers can create projects and authenticate API requests with scoped secret keys.  
**Depends on:** Sprint 00  
**Blocks:** Sprint 02, 06, 08

---

## Objectives

1. `projects` and `api_keys` database tables
2. API key issuance, rotation, revocation
3. `AuthenticateAPIKey` middleware alongside existing JWT auth
4. REST endpoints for project/key CRUD
5. Keys never stored in plaintext (hash + prefix display)

---

## Tasks

### Task 01.1 — Database migration

**Estimate:** 3 pts

```sql
-- migrations/000022_developer_platform.up.sql (example)

CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL REFERENCES users(id),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(64) NOT NULL,
  environment VARCHAR(16) NOT NULL DEFAULT 'production', -- sandbox | production
  allowed_origins JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(owner_user_id, slug)
);

CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  prefix VARCHAR(16) NOT NULL,        -- sk_test_abc, sk_live_xyz
  key_hash VARCHAR(255) NOT NULL,     -- bcrypt or sha256
  scopes JSONB NOT NULL DEFAULT '[]',
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

- [ ] Down migration included
- [ ] Index on `api_keys(prefix)` for lookup
- [ ] Domain entities in `internal/domain/project/`, `internal/domain/apikey/`

---

### Task 01.2 — Key generation service

**Estimate:** 5 pts

- [ ] `pkg/apikey/generate.go` — format: `sk_{test|live}_{32_random}`
- [ ] Store only bcrypt hash; return full key once on create
- [ ] Prefix shown in dashboard: `sk_live_abc...xyz` (first 8 + last 4)
- [ ] Unit tests: collision resistance, format validation

---

### Task 01.3 — Auth middleware

**Estimate:** 8 pts

File: `internal/handler/middleware/api_key.go`

```go
// Principal attached to context
type APIKeyPrincipal struct {
    KeyID     string
    ProjectID string
    Scopes    []string
    Environment string
}
```

- [ ] `AuthenticateAPIKey` — parse `Authorization: Bearer sk_...`
- [ ] `RequireScope("streams:write")` — composable with chi
- [ ] `AuthenticateAny` — try API key, then JWT (for transitional endpoints)
- [ ] Update `last_used_at` async (don't block request)
- [ ] Reject revoked/expired keys with `unauthorized`

---

### Task 01.4 — Project & key handlers

**Estimate:** 8 pts

Routes under `/api/v1/projects` (JWT auth for management):

| Method | Path | Action |
|--------|------|--------|
| POST | `/projects` | Create project |
| GET | `/projects` | List user's projects |
| GET | `/projects/{id}` | Get project |
| PATCH | `/projects/{id}` | Update name, origins |
| DELETE | `/projects/{id}` | Soft delete |
| POST | `/projects/{id}/api-keys` | Create key (returns secret once) |
| GET | `/projects/{id}/api-keys` | List keys (no secrets) |
| DELETE | `/projects/{id}/api-keys/{key_id}` | Revoke |

Usecase: `internal/usecase/project/`

- [ ] OpenAPI updated
- [ ] Audit log entry on key create/revoke

---

### Task 01.5 — Prove key auth on streams

**Estimate:** 5 pts

- [ ] `POST /api/v1/streams` accepts API key with `streams:write`
- [ ] `GET /api/v1/streams` lists streams for key's project only (filter added in Sprint 02; stub project_id this sprint)
- [ ] Integration test: create key → create stream

---

### Task 01.6 — Security hardening

**Estimate:** 3 pts

- [ ] Max 25 active keys per project
- [ ] Rate limit key creation: 10/hour per user
- [ ] Never log full key (redact in zap)
- [ ] Document key rotation runbook

---

## Implementation prompt

```
Sprint 01 — Developer identity & API keys.

Implement Task 01.3 and 01.4:
- Add api_keys and projects tables (migration 000022)
- Create AuthenticateAPIKey middleware compatible with existing JWT flow
- Add /api/v1/projects CRUD and /api/v1/projects/{id}/api-keys

Follow patterns in:
- internal/handler/middleware/auth.go
- internal/handler/auth/handler.go
- internal/usecase/auth/

Key format: sk_test_* and sk_live_*
Hash with bcrypt. Return plaintext only in 201 response body once.

Do not break existing JWT-authenticated dashboard flows.
Write integration test proving sk_test key can POST /streams.
```

---

## Acceptance criteria (sprint)

- [ ] Create project via JWT, issue `sk_test_` key, create stream via key
- [ ] Revoked key returns 401
- [ ] OpenAPI documents all new endpoints
- [ ] No plaintext keys in database or logs

---

## Demo script

```bash
# Login (dashboard JWT via proxy or direct)
TOKEN=$(curl -s -X POST localhost:8080/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"...","password":"..."}' | jq -r '.data.access_token')

# Create project
PROJ=$(curl -s -X POST localhost:8080/api/v1/projects \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"My App","slug":"my-app"}' | jq -r '.data.id')

# Create API key
SK=$(curl -s -X POST localhost:8080/api/v1/projects/$PROJ/api-keys \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"CI","scopes":["streams:write","streams:read"]}' | jq -r '.data.secret')

# Use API key
curl -X POST localhost:8080/api/v1/streams \
  -H "Authorization: Bearer $SK" \
  -d '{"title":"API test","mode":"room","visibility":"private"}'
```

---

## Files likely touched

```
talkietalker-stream-backend/migrations/000022_*
talkietalker-stream-backend/internal/domain/project/
talkietalker-stream-backend/internal/domain/apikey/
talkietalker-stream-backend/internal/repository/postgres/project/
talkietalker-stream-backend/internal/usecase/project/
talkietalker-stream-backend/internal/handler/project/
talkietalker-stream-backend/internal/handler/middleware/api_key.go
talkietalker-stream-backend/cmd/api/main.go
talkietalker-stream-web/docs/openapi.yaml
```

**Next:** [Sprint 02 — Tenant isolation & scopes](./sprint-02-tenant-isolation-and-scopes.md)
