# StreamFlow Monorepo

StreamFlow is a live streaming and WebRTC conferencing platform.

| Package | Description | Dev command |
|---------|-------------|-------------|
| [stream-backend](./stream-backend/) | Go API, SFU, RTMP ingest, billing | `go run ./cmd/...` |
| [stream-web](./stream-web/) | Next.js dashboard and marketing site | `npm run dev` (port 3000) |
| [stream-docs](./stream-docs/) | Documentation site | `npm run dev` (port 3001) |

## Local development

1. Start backend dependencies (PostgreSQL, Redis, RabbitMQ) and run migrations.
2. Start **stream-backend** on port 8080.
3. Start **stream-web**:

```bash
cd stream-web
npm install
NEXT_PUBLIC_API_URL=http://localhost:8080 npm run dev
```

4. Start **stream-docs** (optional, for `/docs` proxy):

```bash
cd stream-docs
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
| `NEXT_PUBLIC_API_URL` | stream-web | REST API base |
| `NEXT_PUBLIC_WS_URL` | stream-web | WebSocket base |
| `DOCS_URL` | stream-web | Docs rewrite target (default `http://localhost:3001`) |
| `NEXT_PUBLIC_APP_URL` | stream-docs | Link back to main app |

## Documentation

Product and API docs live in **stream-docs**. Content is MDX under `stream-docs/content/`.

OpenAPI spec: `stream-web/docs/openapi.yaml`

## Developer platform conversion

Staff-engineer playbooks for turning StreamFlow into a developer-focused platform (API keys, SDKs, webhooks, embeds) live in **[dev-platform/](./dev-platform/)**. Start with [dev-platform/README.md](./dev-platform/README.md) and [MASTER-PROMPT.md](./dev-platform/MASTER-PROMPT.md).
