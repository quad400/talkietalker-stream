# Sprint 07 — Documentation & Sandbox

**Duration:** 2 weeks  
**Goal:** A developer can go from zero to embedded room in 15 minutes using only public docs.  
**Depends on:** Sprint 04, 05, 06  
**Blocks:** Sprint 10

---

## Objectives

1. New `talkietalker-stream-docs/content/developers/` section
2. Interactive quickstart (copy-paste verified in CI)
3. Sandbox environment documented and enforced
4. OpenAPI explorer in docs
5. Migration guide for self-hosters

---

## Tasks

### Task 07.1 — Docs information architecture

**Estimate:** 3 pts

Update `talkietalker-stream-docs/src/lib/navigation.ts`:

```typescript
{
  title: "Developers",
  items: [
    { title: "Quickstart", href: "/developers/quickstart" },
    { title: "Authentication", href: "/developers/authentication" },
    { title: "API keys & scopes", href: "/developers/api-keys" },
    { title: "Embed tokens", href: "/developers/embed-tokens" },
    { title: "Webhooks", href: "/developers/webhooks" },
    { title: "React SDK", href: "/developers/stream-react-sdk" },
    { title: "Node SDK", href: "/developers/stream-sdk-sdk" },
    { title: "iframe embed", href: "/developers/iframe-embed" },
    { title: "Errors", href: "/developers/errors" },
    { title: "Sandbox", href: "/developers/sandbox" },
    { title: "Self-hosting for integrators", href: "/developers/self-host" },
  ],
}
```

---

### Task 07.2 — 15-minute quickstart

**Estimate:** 5 pts

`content/developers/quickstart.mdx` — linear tutorial:

1. Create account → developer dashboard
2. Create sandbox project + `sk_test_` key
3. `curl` or Node SDK: create room stream
4. Mint embed token
5. Render `<TalkieTalkerRoom />` or iframe
6. Optional: webhook for `room.participant.joined`

- [ ] Every code block tested in CI (`scripts/verify-quickstart.sh`)
- [ ] Screenshots or ASCII diagrams

---

### Task 07.3 — Authentication guide

**Estimate:** 3 pts

Document three auth paths:

| Path | Credential | Where |
|------|------------|-------|
| Server | `sk_live_` / `sk_test_` | Integrator backend |
| Browser | Embed JWT | Minted by backend |
| Dashboard | User JWT | talkietalker-stream-web only |

Include security do's and don'ts.

---

### Task 07.4 — Sandbox configuration

**Estimate:** 5 pts

**Backend limits for `environment=sandbox`:**

| Limit | Value |
|-------|-------|
| API requests | 100/min per project |
| Concurrent live streams | 3 |
| Max room participants | 10 |
| Webhook deliveries | 1000/day |
| Recording | Disabled or 5 min max |

- [ ] Return `sandbox_limit_exceeded` error with doc link
- [ ] Document in `developers/sandbox.mdx`

---

### Task 07.5 — OpenAPI explorer

**Estimate:** 3 pts

- [ ] Embed Redoc or Scalar at `/docs/developers/api-reference`
- [ ] Pull spec from `/openapi.yaml` (serve from talkietalker-stream-docs or talkietalker-stream-web)
- [ ] Try-it-out disabled for mutations (or sandbox only)

---

### Task 07.6 — Example repositories

**Estimate:** 5 pts

| Repo / folder | Stack |
|---------------|-------|
| `examples/stream-sdk-quickstart` | Node + curl |
| `examples/stream-react-embed-room` | Vite + React SDK |
| `examples/nextjs-live-class` | Next.js full stack |
| `examples/webhook-receiver` | From Sprint 03 |

Each README: prerequisites, env vars, `npm run dev`, expected output

---

### Task 07.7 — Landing page developer CTA

**Estimate:** 2 pts

Update `talkietalker-stream-web/src/app/(landing)/page.tsx` DevelopersSection:

- [ ] Link to `/docs/developers/quickstart`
- [ ] Code snippet: 6 lines Node SDK
- [ ] "View API reference" button

---

## Implementation prompt

```
Sprint 07 — Documentation & sandbox.

1. Create talkietalker-stream-docs/content/developers/*.mdx per Task 07.1
2. Write quickstart that matches examples/stream-react-embed-room exactly
3. Implement sandbox rate limits in talkietalker-stream-backend middleware
4. Add verify-quickstart.sh CI script

Tone: Stripe docs — imperative, short sentences, working code first.
Cross-link to OpenAPI for every REST mention.
```

---

## Acceptance criteria

- [ ] New developer completes quickstart unaided (user test with 1 external dev)
- [ ] CI verifies quickstart scripts pass
- [ ] Sandbox limits return documented errors
- [ ] Navigation searchable in docs site

**Next:** [Sprint 08 — Metering & developer billing](./sprint-08-metering-and-developer-billing.md)
