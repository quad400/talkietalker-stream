# Sprint 10 — Production Hardening & Launch

**Duration:** 2 weeks  
**Goal:** GA-ready developer platform with SLA, observability, security review, and launch assets.  
**Depends on:** All previous sprints  
**Blocks:** —

---

## Objectives

1. Load test API + signaling at target QPS
2. Security penetration review on API keys & webhooks
3. Status page + incident runbooks
4. GA launch checklist complete
5. Design partner graduation to production keys

---

## Tasks

### Task 10.1 — Load testing

**Estimate:** 8 pts

Scenarios (k6 or vegeta):

| Scenario | Target |
|----------|--------|
| API create stream | 500 req/s sustained |
| API list streams | 1000 req/s |
| Webhook delivery | 10k events/min |
| Concurrent WS connections | 5k signaling |
| Concurrent SFU peers | 1k (staging) |

- [ ] Document bottlenecks + scaling plan
- [ ] Redis connection pool tuning
- [ ] Rate limiter verified under load

Output: `dev-platform/artifacts/load-test-report.md`

---

### Task 10.2 — Security review

**Estimate:** 5 pts

Checklist:

- [ ] API key storage (bcrypt, no leaks)
- [ ] Embed token TTL and claim validation
- [ ] Webhook SSRF protections tested
- [ ] CORS misconfiguration tests
- [ ] SQL injection on new endpoints
- [ ] Scope escalation attempts
- [ ] Dependency audit (`govulncheck`, `npm audit`)

Optional: external pen test for GA.

---

### Task 10.3 — Observability

**Estimate:** 5 pts

- [ ] Prometheus metrics: `streamflow_api_requests_total`, `webhook_delivery_duration`, `sfu_peers_active`
- [ ] Grafana dashboard: developer platform health
- [ ] Alerting: webhook DLQ depth, API 5xx rate, SFU errors
- [ ] OpenTelemetry traces on API key requests (sample 1%)

---

### Task 10.4 — Runbooks

**Estimate:** 3 pts

`dev-platform/runbooks/`:

| Runbook | Topics |
|---------|--------|
| `api-key-compromise.md` | Revoke, rotate, notify customers |
| `webhook-delivery-failure.md` | DLQ replay, endpoint disable |
| `sfu-overload.md` | Scale, per-project caps |
| `sandbox-abuse.md` | Rate limit, account suspend |

---

### Task 10.5 — Status page & changelog

**Estimate:** 3 pts

- [ ] status.talkietalker.stream (or Better Uptime / Instatus)
- [ ] Subscribe to incidents
- [ ] `talkietalker-stream-docs/content/developers/changelog.mdx` — API versioning policy
- [ ] Deprecation policy: 90-day notice for breaking changes

---

### Task 10.6 — GA launch checklist

**Estimate:** 5 pts

- [ ] 3+ design partners on production keys
- [ ] SDK published to npm and Go module tagged `v1.0.0`
- [ ] Docs quickstart verified by external developer
- [ ] Support channel: Discord `#developers` or GitHub Discussions
- [ ] Legal: API Terms of Service, DPA template
- [ ] Pricing page live
- [ ] Blog post: "TalkieTalkerStream for Developers"
- [ ] HN / Product Hunt launch assets

---

### Task 10.7 — Post-launch monitoring (week 1)

**Estimate:** 3 pts

- [ ] Daily review: error rates, webhook success, support tickets
- [ ] Fix P0/P1 within 24h
- [ ] Collect NPS from first 20 developers
- [ ] Sprint retro + v1.1 roadmap

---

## Implementation prompt

```
Sprint 10 — Launch hardening.

1. Write k6 load test for POST /streams with API keys
2. Add Prometheus metrics middleware to talkietalker-stream-backend
3. Create dev-platform/runbooks/ for key compromise and webhook failures
4. Complete GA checklist in sprint file

Do not add new features. Focus on reliability, docs, and launch assets.
Report load test results with p50/p95/p99 latency.
```

---

## Acceptance criteria (program complete)

- [ ] Load test meets targets or documented scaling plan approved
- [ ] Zero P0 security findings open
- [ ] Status page operational
- [ ] `@talkietalker/stream-sdk@1.0.0` and `@talkietalker/stream-react@1.0.0` published
- [ ] 3 design partners live on production
- [ ] Team sign-off on [README.md](../README.md) definition of done

---

## Retro — full program

1. What took longer than estimated?
2. Which sprints could merge for a smaller team?
3. What did design partners request that we deferred?
4. v1.1 priorities: mobile SDK, WHIP, GraphQL?

---

## Post-GA roadmap (parking lot)

| Item | Source |
|------|--------|
| WHIP browser ingest | `streaming-platform-prompt.md` |
| OAuth 2.0 apps (3-legged) | Enterprise requests |
| Terraform provider | DevOps integrators |
| CLI `streamflow` | Power users |
| Regional SFU | Latency requirements |
| HIPAA / SOC2 | Healthcare segment |

**Congratulations — TalkieTalkerStream is now a developer platform.**
