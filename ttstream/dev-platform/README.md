# TalkieTalkerStream: SaaS → Developer Platform

Staff-engineer playbooks for converting **TalkieTalkerStream** from a first-party SaaS (hosts log in, use the dashboard) into a **developer platform** (other teams embed live broadcast, WebRTC rooms, chat, recordings, and monetization into their own products via APIs, SDKs, and webhooks).

## How to use these guides

| Audience | Start here |
|----------|------------|
| **You (product / eng lead)** | [TRANSFORMATION-STRATEGY.md](./TRANSFORMATION-STRATEGY.md) → [SPRINT-ROADMAP.md](./SPRINT-ROADMAP.md) |
| **Staff engineer / tech lead** | [MASTER-PROMPT.md](./MASTER-PROMPT.md) → [TARGET-ARCHITECTURE.md](./TARGET-ARCHITECTURE.md) |
| **Implementing a sprint** | Open the matching file under [sprints/](./sprints/) |
| **AI pairing session** | Paste [MASTER-PROMPT.md](./MASTER-PROMPT.md) + the active sprint file into context |

## Document map

| File | Purpose |
|------|---------|
| [MASTER-PROMPT.md](./MASTER-PROMPT.md) | Comprehensive system prompt for staff-level execution |
| [CURRENT-STATE.md](./CURRENT-STATE.md) | Inventory of everything already built (mapped to code) |
| [TRANSFORMATION-STRATEGY.md](./TRANSFORMATION-STRATEGY.md) | Why, what, and sequencing of the conversion |
| [TARGET-ARCHITECTURE.md](./TARGET-ARCHITECTURE.md) | End-state architecture for a developer platform |
| [SPRINT-ROADMAP.md](./SPRINT-ROADMAP.md) | 11-sprint overview, dependencies, milestones |
| [TASK-INDEX.md](./TASK-INDEX.md) | Flat task backlog for issue tracker import |
| [sprints/](./sprints/) | Per-sprint tasks, acceptance criteria, and implementation prompts |

## Relationship to existing docs

- **Product docs:** `talkietalker-stream-docs/content/` — end-user and API reference (extend in Sprint 7)
- **OpenAPI:** `talkietalker-stream-web/docs/openapi.yaml` — REST surface (stabilize in Sprint 0)
- **Backend README:** `talkietalker-stream-backend/README.md` — domain model and entities
- **Prior prompt:** `streaming-platform-prompt.md` — browser broadcast extension (orthogonal; reuse SFU)

## Sprint index

| Sprint | Theme | Duration (guide) |
|--------|-------|------------------|
| [00](./sprints/sprint-00-audit-and-api-stabilization.md) | Audit & API stabilization | 2 weeks |
| [01](./sprints/sprint-01-developer-identity-and-api-keys.md) | Developer identity & API keys | 2 weeks |
| [02](./sprints/sprint-02-tenant-isolation-and-scopes.md) | Tenant isolation & scopes | 2 weeks |
| [03](./sprints/sprint-03-webhooks-and-events.md) | Webhooks & event bus | 2 weeks |
| [04](./sprints/sprint-04-server-sdks.md) | Server SDKs (Go, Node, Python) | 3 weeks |
| [05](./sprints/sprint-05-client-sdk-and-embeddables.md) | Client SDK & embeddable UI | 3 weeks |
| [06](./sprints/sprint-06-developer-dashboard.md) | Developer dashboard | 2 weeks |
| [07](./sprints/sprint-07-documentation-and-sandbox.md) | Docs portal & sandbox | 2 weeks |
| [08](./sprints/sprint-08-metering-and-developer-billing.md) | API metering & dev billing | 2 weeks |
| [09](./sprints/sprint-09-white-label-and-customization.md) | White-label & customization | 2 weeks |
| [10](./sprints/sprint-10-production-hardening-and-launch.md) | Hardening & launch | 2 weeks |

**Total guided timeline:** ~24 weeks (adjust per team size).

## Definition of done (platform launch)

A third-party developer can:

1. Sign up for a **developer account**, create a **project**, and issue **scoped API keys**
2. Create streams/rooms, manage access, and receive **webhooks** for lifecycle events
3. Embed a **room or player** in their app with `@talkietalker/stream-react` (or iframe) in &lt; 30 minutes
4. Use **server SDKs** with typed clients, retries, and idempotency keys
5. Read **complete docs** with copy-paste quickstarts and a **sandbox** environment
6. See **usage meters** and stay within plan limits without contacting support
