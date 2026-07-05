# StreamFlow Next.js example

Everything you need for a Next.js App Router app with live rooms.

## Prerequisites

- Stream backend running on `http://localhost:8080`
- Project keys from the developer dashboard (or create a project in the dashboard)

## Setup

```bash
cd examples/nextjs-live-class
npm install
cp .env.example .env.local
```

Fill in `.env.local`:

```bash
STREAMFLOW_SECRET_KEY=sk_test_...
STREAMFLOW_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STREAMFLOW_PUBLISH_KEY=pk_test_...
```

Create a room and get the join URL:

```bash
npm run create-room
```

Start the app:

```bash
npm run dev
```

Open the URL printed by `create-room` (e.g. `http://localhost:3002/room/<uuid>`).

## What's included

| File | Purpose |
|------|---------|
| `app/api/streamflow/[...route]/route.ts` | Token + webhook routes (`streamflowHandlers()`) |
| `app/layout.tsx` | `<StreamFlow>` provider |
| `app/room/[id]/page.tsx` | `<StreamFlowRoom>` |
| `scripts/create-room.mjs` | Creates a room via `@streamflow/node` |

No manual token fetch, no `wsUrl`, no API base URL in the browser.

## Production

- Add `authenticateTokenRequest` to `streamflowHandlers()` to gate token minting behind your auth
- Set the same three keys in your hosting provider's env settings
