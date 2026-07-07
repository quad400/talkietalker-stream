# Sprint 08 — Metering & Developer Billing

**Duration:** 2 weeks  
**Goal:** Usage is metered per project; developers understand cost before production scale.  
**Depends on:** Sprint 01  
**Blocks:** Sprint 10

---

## Objectives

1. Extend `usage_records` for API-level metrics
2. Per-project usage dashboard
3. Plan tiers (free / pro / enterprise) with limits
4. Overage alerts via webhooks + notifications
5. Billing API for programmatic usage queries

---

## Tasks

### Task 08.1 — New metric types

**Estimate:** 5 pts

Extend `usage_records.metric_type` enum:

| Metric | Unit | When recorded |
|--------|------|---------------|
| `api_requests` | count | Each API key request (sampled) |
| `embed_minutes` | minutes | Room participant time via embed token |
| `viewer_minutes` | minutes | Broadcast watch time (existing viewer_hours) |
| `bandwidth_gb` | GB | Existing |
| `storage_gb` | GB/month | Existing |
| `webhook_deliveries` | count | Successful deliveries |

- [ ] Migration for enum extension
- [ ] `billingusecase.RecordAPIRequest(projectID, ...)`
- [ ] Hook middleware from Sprint 06 logs

---

### Task 08.2 — Plan & limits model

**Estimate:** 5 pts

```sql
CREATE TABLE developer_plans (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  plan VARCHAR(32) NOT NULL, -- free | pro | enterprise
  limits JSONB NOT NULL,
  stripe_subscription_id VARCHAR(255),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ
);
```

Default free tier limits:

```json
{
  "api_requests_monthly": 100000,
  "embed_minutes_monthly": 1000,
  "concurrent_rooms": 5,
  "webhook_endpoints": 3
}
```

- [ ] Enforce limits at middleware (soft warn at 80%, hard block at 100%)
- [ ] `usage.limit_approaching` webhook event

---

### Task 08.3 — Usage API

**Estimate:** 5 pts

`GET /api/v1/projects/{id}/usage?period=current`

```json
{
  "period_start": "...",
  "period_end": "...",
  "metrics": {
    "api_requests": { "used": 45000, "limit": 100000 },
    "embed_minutes": { "used": 320, "limit": 1000 }
  }
}
```

Scope: `billing:read`

---

### Task 08.4 — Developer billing UI

**Estimate:** 5 pts

`/dashboard/developer/billing`:

- [ ] Usage charts (reuse billing feature components)
- [ ] Current plan + upgrade CTA
- [ ] Invoice history for developer plans (Stripe)
- [ ] Export CSV

---

### Task 08.5 — Cost estimator docs

**Estimate:** 3 pts

`talkietalker-stream-docs/content/developers/pricing.mdx`:

- [ ] Pricing table per metric
- [ ] Interactive estimator (optional MDX component)
- [ ] Compare sandbox (free) vs production

---

## Implementation prompt

```
Sprint 08 — Developer billing.

Extend existing billing usecase (internal/usecase/billing/) for project-scoped metrics.

1. Add api_requests and embed_minutes metric types
2. Record api_requests in API key middleware (async, non-blocking)
3. Implement developer_plans with free tier defaults on project create
4. Enforce api_requests_monthly limit — return 429 usage_limit_exceeded

Reuse Stripe patterns from existing billing_accounts flow.
Do not break existing streamer usage billing.
```

---

## Acceptance criteria

- [ ] Project usage visible in developer dashboard
- [ ] Hitting free tier API limit returns 429 with upgrade link
- [ ] `usage.limit_approaching` webhook fires at 80%
- [ ] Existing per-stream billing unchanged

**Next:** [Sprint 09 — White-label & customization](./sprint-09-white-label-and-customization.md)
