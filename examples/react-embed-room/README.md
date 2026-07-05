# StreamFlow React (Vite) example

Everything you need for a plain React + Vite app with live rooms.

## Prerequisites

- Stream backend running on `http://localhost:8080`
- Project keys from the developer dashboard

## Setup

```bash
cd examples/react-embed-room
npm install
cp .env.example .env
```

Fill in `.env`:

```bash
STREAMFLOW_SECRET_KEY=sk_test_...
STREAMFLOW_WEBHOOK_SECRET=whsec_...
VITE_STREAMFLOW_PUBLISH_KEY=pk_test_...
```

Create a room (writes `VITE_ROOM_ID` into `.env`):

```bash
npm run create-room
```

Start the app (Express API + Vite in one command):

```bash
npm run dev
```

Open http://localhost:5173

## What's included

| File | Purpose |
|------|---------|
| `server/dev-server.mjs` | Express token route (`streamflowRouter()`) |
| `src/main.tsx` | `<StreamFlow>` + `<StreamFlowRoom>` |
| `vite.config.ts` | Proxies `/api/streamflow` → Express on `:3001` |
| `scripts/create-room.mjs` | Creates a room and saves ID to `.env` |

## vs Next.js example

This example uses a separate Express server for the token route (typical for Vite/CRA).
See [`examples/nextjs-live-class`](../nextjs-live-class/) for the App Router approach.
