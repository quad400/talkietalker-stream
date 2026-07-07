# Sprint 03 — Webhooks & Events

**Duration:** 2 weeks  
**Goal:** Integrators receive reliable, signed HTTP callbacks for domain events.  
**Depends on:** Sprint 02  
**Blocks:** Sprint 04, 06

---

## Objectives

1. `webhook_endpoints` and `webhook_deliveries` tables
2. Domain event emission from usecases
3. Webhook delivery worker with retries
4. HMAC signature verification documented
5. CRUD API for webhook management

---

## Tasks

### Task 03.1 — Database schema

**Estimate:** 3 pts

```sql
CREATE TABLE webhook_endpoints (
  id UUID PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id),
  url TEXT NOT NULL,
  secret VARCHAR(255) NOT NULL,  -- whsec_... for signing
  enabled_events JSONB NOT NULL DEFAULT '["*"]',
  status VARCHAR(16) DEFAULT 'enabled',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE webhook_deliveries (
  id UUID PRIMARY KEY,
  endpoint_id UUID NOT NULL REFERENCES webhook_endpoints(id),
  event_id VARCHAR(64) NOT NULL,
  event_type VARCHAR(128) NOT NULL,
  payload JSONB NOT NULL,
  status VARCHAR(16) NOT NULL, -- pending | delivered | failed
  attempts INT NOT NULL DEFAULT 0,
  last_attempt_at TIMESTAMPTZ,
  response_status INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

### Task 03.2 — Event catalog v1

**Estimate:** 3 pts

| Event | Emitted when | Payload object |
|-------|--------------|----------------|
| `stream.created` | Stream created | `stream` |
| `stream.started` | Status → live | `stream` |
| `stream.ended` | Status → ended | `stream` |
| `room.participant.joined` | join_room success | `participant` |
| `room.participant.left` | leave / disconnect grace finalized | `participant` |
| `recording.ready` | Recording status → ready | `recording` |
| `recording.failed` | Recording failed | `recording` |
| `access.granted` | Comp or purchase | `access_grant` |

- [ ] Define in `internal/domain/events/types.go`
- [ ] Document in `talkietalker-stream-docs/content/developers/webhooks.mdx`

---

### Task 03.3 — Event publisher

**Estimate:** 5 pts

- [ ] `internal/usecase/events/publisher.go` — publish to RabbitMQ exchange `streamflow.events`
- [ ] Hook into: `streamusecase` start/stop, `meetingusecase` join/leave, `recordingusecase` finalize
- [ ] Include `project_id`, `livemode` (sandbox vs production)
- [ ] Reuse existing outbox pattern from `internal/worker/`

---

### Task 03.4 — Webhook delivery worker

**Estimate:** 8 pts

- [ ] Consumer: `internal/worker/webhook_delivery.go`
- [ ] Signing: `HMAC-SHA256(timestamp + "." + body, secret)` → header `X-TalkieTalkerStream-Signature: t=...,v1=...`
- [ ] Retry: 5 attempts, exponential backoff (1m, 5m, 30m, 2h, 24h)
- [ ] DLQ after max attempts
- [ ] Timeout: 10s per delivery
- [ ] SSRF protection: block private IP ranges, localhost in production

---

### Task 03.5 — Webhook management API

**Estimate:** 5 pts

JWT or API key with `webhooks:manage`:

| Method | Path |
|--------|------|
| POST | `/api/v1/projects/{id}/webhooks` |
| GET | `/api/v1/projects/{id}/webhooks` |
| PATCH | `/api/v1/webhooks/{id}` |
| DELETE | `/api/v1/webhooks/{id}` |
| POST | `/api/v1/webhooks/{id}/test` | Send `webhook.test` event |
| GET | `/api/v1/webhooks/{id}/deliveries` | Delivery log |

---

### Task 03.6 — Example receiver

**Estimate:** 3 pts

- [ ] `examples/webhook-receiver/` — Express or Go minimal server
- [ ] Verify signature, print events
- [ ] README with ngrok instructions

---

## Implementation prompt

```
Sprint 03 — Webhooks.

Implement webhook delivery worker and stream.started / stream.ended events.

1. Create webhook_endpoints + webhook_deliveries migrations
2. Publish events from streamusecase.Start and streamusecase.Stop
3. Worker consumes from RabbitMQ, POSTs signed payload to endpoint URL
4. Add SSRF check: reject 10.x, 172.16-31.x, 192.168.x, 127.x, ::1

Follow Stripe webhook signature style for docs familiarity.
Add examples/webhook-receiver with signature verification code.
```

---

## Acceptance criteria

- [ ] `POST /webhooks/{id}/test` delivers within 5 seconds
- [ ] Failed endpoint retries with backoff (visible in deliveries log)
- [ ] Signature verification documented with copy-paste code
- [ ] `stream.started` fires when RTMP ingest starts AND when room goes live

---

## Demo script

```bash
# Start ngrok + example receiver
ngrok http 3456 &
node examples/webhook-receiver/server.js

# Register webhook
curl -X POST localhost:8080/api/v1/projects/$PROJ/webhooks \
  -H "Authorization: Bearer $SK" \
  -d '{"url":"https://xxxx.ngrok.io/webhooks","enabled_events":["stream.*"]}'

# Start stream → see event in receiver logs
```

**Next:** [Sprint 04 — Server SDKs](./sprint-04-server-sdks.md)
