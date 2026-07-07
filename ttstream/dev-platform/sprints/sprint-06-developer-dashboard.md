# Sprint 06 — Developer Dashboard

**Duration:** 2 weeks  
**Goal:** First-party UI for managing projects, API keys, webhooks, and viewing request logs.  
**Depends on:** Sprint 01, Sprint 03  
**Blocks:** Sprint 07, 09

---

## Objectives

1. `/dashboard/developer` section in `talkietalker-stream-web`
2. Project switcher in dashboard shell
3. API key management UI (create, revoke, copy-once)
4. Webhook endpoint UI + delivery log viewer
5. Request log viewer (last 7 days)

---

## Tasks

### Task 06.1 — Navigation & routing

**Estimate:** 3 pts

Add to `nav-config.ts`:

```typescript
export const dashboardDeveloperNav = [
  { label: "Projects", href: "/dashboard/developer/projects" },
  { label: "API keys", href: "/dashboard/developer/api-keys" },
  { label: "Webhooks", href: "/dashboard/developer/webhooks" },
  { label: "Logs", href: "/dashboard/developer/logs" },
  { label: "Documentation", href: "/docs/developers/quickstart", external: true },
]
```

Routes:

```
/dashboard/developer/projects
/dashboard/developer/projects/[id]
/dashboard/developer/projects/[id]/keys
/dashboard/developer/projects/[id]/webhooks
/dashboard/developer/logs
```

---

### Task 06.2 — Projects UI

**Estimate:** 5 pts

- [ ] List projects with environment badge (sandbox / production)
- [ ] Create project modal (name, slug, allowed origins)
- [ ] Edit allowed CORS origins (textarea, one per line)
- [ ] Delete project with confirmation (type slug)

Feature module: `talkietalker-stream-web/src/features/developer/`

---

### Task 06.3 — API keys UI

**Estimate:** 5 pts

- [ ] Create key: name + scope checkboxes
- [ ] Show secret **once** in modal with copy button
- [ ] List keys: prefix, name, scopes, last used, revoke
- [ ] Never re-fetch secret after create

---

### Task 06.4 — Webhooks UI

**Estimate:** 5 pts

- [ ] Add endpoint URL + event type multiselect
- [ ] Show signing secret once on create (`whsec_...`)
- [ ] Test webhook button → calls `POST /webhooks/{id}/test`
- [ ] Delivery log table: event, status, attempts, timestamp, response code
- [ ] Expand row to see payload JSON

---

### Task 06.5 — Request logs (backend + UI)

**Estimate:** 8 pts

**Backend:**

```sql
CREATE TABLE api_request_logs (
  id UUID PRIMARY KEY,
  project_id UUID,
  api_key_id UUID,
  method VARCHAR(8),
  path VARCHAR(512),
  status INT,
  duration_ms INT,
  request_id VARCHAR(64),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

- [ ] Middleware logs API key requests (sample 100% sandbox, 10% production)
- [ ] TTL: 7 days (partition or cron delete)

**UI:** Filterable table, link to stream/resource if parseable

---

### Task 06.6 — Onboarding checklist

**Estimate:** 3 pts

First-visit card on `/dashboard/developer`:

- [ ] Create project
- [ ] Create API key
- [ ] Make first API call (link to quickstart)
- [ ] Set up webhook
- [ ] Embed a room

Store progress in `localStorage` or user preferences API

---

## Implementation prompt

```
Sprint 06 — Developer dashboard.

Add /dashboard/developer section to talkietalker-stream-web:

1. features/developer/api.ts — projects, keys, webhooks client
2. components/dashboard/developer/ — pages per task 06.2-06.4
3. Add developer nav section to dashboard sidebar (below Account)
4. Implement api_request_logs migration + logging middleware

Match existing dashboard visual style (shadcn, tailwind).
Use TanStack Query patterns from features/streams/queries.ts.
```

---

## Acceptance criteria

- [ ] User creates sandbox project and API key without curl
- [ ] Webhook test shows delivery in UI within 10s
- [ ] Request log shows last API call with request_id
- [ ] Mobile-responsive tables

**Next:** [Sprint 07 — Documentation & sandbox](./sprint-07-documentation-and-sandbox.md)
