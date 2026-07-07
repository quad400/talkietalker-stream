# TalkieTalker Stream Monorepo

TalkieTalker Stream is a live streaming and WebRTC conferencing platform.

| Package | Description | Dev command |
|---------|-------------|-------------|
| [talkietalker-stream-backend](./talkietalker-stream-backend/) | Go API, SFU, RTMP ingest, billing | `go run ./cmd/...` |
| [talkietalker-stream-web](./talkietalker-stream-web/) | Next.js dashboard and marketing site | `npm run dev` (port 3000) |
| [talkietalker-stream-docs](./talkietalker-stream-docs/) | Documentation site | `npm run dev` (port 3001) |
| [@talkietalker/stream-sdk](./packages/talkietalker-stream-node/) | Node.js server SDK | `npm run build --workspace=@talkietalker/stream-sdk` |
| [@talkietalker/stream-react](./packages/talkietalker-stream-react/) | React room/player SDK | `npm run build --workspace=@talkietalker/stream-react` |

## Local development

1. Start backend dependencies (PostgreSQL, Redis, RabbitMQ) and run migrations.
2. Start **talkietalker-stream-backend** on port 8080.
3. Start **talkietalker-stream-web**:

```bash
cd talkietalker-stream-web
npm install
NEXT_PUBLIC_API_URL=http://localhost:8080 npm run dev
```

4. Start **talkietalker-stream-docs** (optional, for `/docs` proxy):

```bash
cd talkietalker-stream-docs
npm install
NEXT_PUBLIC_APP_URL=http://localhost:3000 npm run dev
```

With both frontends running, open:

- App: http://localhost:3000
- Docs (direct): http://localhost:3001/docs
- Docs (via proxy): http://localhost:3000/docs

## Environment

| Variable | Where | Purpose |
|----------|-------|---------|
| `NEXT_PUBLIC_API_URL` | talkietalker-stream-web | REST API base |
| `NEXT_PUBLIC_WS_URL` | talkietalker-stream-web | WebSocket base |
| `DOCS_URL` | talkietalker-stream-web | Docs rewrite target (default `http://localhost:3001`) |
| `NEXT_PUBLIC_APP_URL` | talkietalker-stream-docs | Link back to main app |

## Documentation

Product and API docs live in **talkietalker-stream-docs**. Content is MDX under `talkietalker-stream-docs/content/`.

OpenAPI spec: `talkietalker-stream-web/docs/openapi.yaml`

## Developer platform conversion

Staff-engineer playbooks for the developer platform (API keys, SDKs, webhooks, embeds) live in **[dev-platform/](./dev-platform/)**. Start with [dev-platform/README.md](./dev-platform/README.md) and [MASTER-PROMPT.md](./dev-platform/MASTER-PROMPT.md).

## Repository folder name

The git root may still be named `stream` locally. You can rename it to `talkietalker-stream` on disk and update your remote as needed.
