# Task Index — All Sprints

Flat backlog of every task across the developer platform conversion. Use for issue tracker import.

**Legend:** `⬜` not started · `🟡` in progress · `✅` done

---

## Sprint 00 — Audit & API stabilization (2 wk)

| ID | Task | Pts | Status |
|----|------|-----|--------|
| 00.1 | Endpoint audit matrix | 3 | ⬜ |
| 00.2 | OpenAPI reconciliation | 5 | ⬜ |
| 00.3 | Error catalog + request_id | 3 | ⬜ |
| 00.4 | Response envelope RFC | 2 | ⬜ |
| 00.5 | WebSocket protocol document | 5 | ⬜ |
| 00.6 | Integration test harness | 5 | ⬜ |

---

## Sprint 01 — Developer identity & API keys (2 wk)

| ID | Task | Pts | Status |
|----|------|-----|--------|
| 01.1 | Database migration (projects, api_keys) | 3 | ⬜ |
| 01.2 | Key generation service | 5 | ⬜ |
| 01.3 | AuthenticateAPIKey middleware | 8 | ⬜ |
| 01.4 | Project & key REST handlers | 8 | ⬜ |
| 01.5 | Prove key auth on streams | 5 | ⬜ |
| 01.6 | Security hardening | 3 | ⬜ |

---

## Sprint 02 — Tenant isolation & scopes (2 wk)

| ID | Task | Pts | Status |
|----|------|-----|--------|
| 02.1 | Schema migration (project_id) | 5 | ⬜ |
| 02.2 | Default project backfill | 3 | ⬜ |
| 02.3 | Repository query hardening | 8 | ⬜ |
| 02.4 | Scope enforcement matrix | 5 | ⬜ |
| 02.5 | Embed token endpoint | 8 | ⬜ |
| 02.6 | Publishable keys (stretch) | 3 | ⬜ |

---

## Sprint 03 — Webhooks & events (2 wk)

| ID | Task | Pts | Status |
|----|------|-----|--------|
| 03.1 | Webhook database schema | 3 | ⬜ |
| 03.2 | Event catalog v1 | 3 | ⬜ |
| 03.3 | Event publisher | 5 | ⬜ |
| 03.4 | Webhook delivery worker | 8 | ⬜ |
| 03.5 | Webhook management API | 5 | ⬜ |
| 03.6 | Example webhook receiver | 3 | ⬜ |

---

## Sprint 04 — Server SDKs (3 wk)

| ID | Task | Pts | Status |
|----|------|-----|--------|
| 04.1 | Package workspace setup | 3 | ⬜ |
| 04.2 | OpenAPI codegen pipeline | 5 | ⬜ |
| 04.3 | Node SDK (@talkietalker/stream-sdk) | 8 | ⬜ |
| 04.4 | Go SDK (talkietalker-stream-go) | 8 | ⬜ |
| 04.5 | Idempotency middleware | 5 | ⬜ |
| 04.6 | Python SDK (stretch) | 5 | ⬜ |

---

## Sprint 05 — Client SDK & embeddables (3 wk)

| ID | Task | Pts | Status |
|----|------|-----|--------|
| 05.1 | Extract signaling package | 13 | ⬜ |
| 05.2 | TalkieTalkerRoom component | 8 | ⬜ |
| 05.3 | TalkieTalkerPlayer component | 5 | ⬜ |
| 05.4 | iframe embed host | 5 | ⬜ |
| 05.5 | Configuration & theming API | 3 | ⬜ |
| 05.6 | Bundle & browser support | 3 | ⬜ |

---

## Sprint 06 — Developer dashboard (2 wk)

| ID | Task | Pts | Status |
|----|------|-----|--------|
| 06.1 | Navigation & routing | 3 | ⬜ |
| 06.2 | Projects UI | 5 | ⬜ |
| 06.3 | API keys UI | 5 | ⬜ |
| 06.4 | Webhooks UI | 5 | ⬜ |
| 06.5 | Request logs (backend + UI) | 8 | ⬜ |
| 06.6 | Onboarding checklist | 3 | ⬜ |

---

## Sprint 07 — Documentation & sandbox (2 wk)

| ID | Task | Pts | Status |
|----|------|-----|--------|
| 07.1 | Docs information architecture | 3 | ⬜ |
| 07.2 | 15-minute quickstart | 5 | ⬜ |
| 07.3 | Authentication guide | 3 | ⬜ |
| 07.4 | Sandbox configuration | 5 | ⬜ |
| 07.5 | OpenAPI explorer | 3 | ⬜ |
| 07.6 | Example repositories | 5 | ⬜ |
| 07.7 | Landing page developer CTA | 2 | ⬜ |

---

## Sprint 08 — Metering & developer billing (2 wk)

| ID | Task | Pts | Status |
|----|------|-----|--------|
| 08.1 | New metric types | 5 | ⬜ |
| 08.2 | Plan & limits model | 5 | ⬜ |
| 08.3 | Usage API | 5 | ⬜ |
| 08.4 | Developer billing UI | 5 | ⬜ |
| 08.5 | Cost estimator docs | 3 | ⬜ |

---

## Sprint 09 — White-label & customization (2 wk)

| ID | Task | Pts | Status |
|----|------|-----|--------|
| 09.1 | Branding schema | 3 | ⬜ |
| 09.2 | React SDK theming | 5 | ⬜ |
| 09.3 | iframe branding | 5 | ⬜ |
| 09.4 | Custom embed subdomain (stretch) | 8 | ⬜ |
| 09.5 | Feature flags per project | 5 | ⬜ |
| 09.6 | Custom copy / i18n hooks | 3 | ⬜ |

---

## Sprint 10 — Production hardening & launch (2 wk)

| ID | Task | Pts | Status |
|----|------|-----|--------|
| 10.1 | Load testing | 8 | ⬜ |
| 10.2 | Security review | 5 | ⬜ |
| 10.3 | Observability | 5 | ⬜ |
| 10.4 | Runbooks | 3 | ⬜ |
| 10.5 | Status page & changelog | 3 | ⬜ |
| 10.6 | GA launch checklist | 5 | ⬜ |
| 10.7 | Post-launch monitoring | 3 | ⬜ |

---

## Totals

| Metric | Value |
|--------|-------|
| Sprints | 11 (00–10) |
| Tasks | 68 |
| Story points | ~233 |
| Guided timeline | ~24 weeks |

---

## Issue tracker import template

```
Title: [DP-XX.Y] Task name
Labels: developer-platform, sprint-XX
Milestone: Sprint XX — Name
Body: Link to dev-platform/sprints/sprint-XX-*.md#task-xxY
```
