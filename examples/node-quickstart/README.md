# Node SDK quickstart

Creates a private room stream and issues an embed token using `@streamflow/node`. Matches step 3–4 of the [developer quickstart](https://github.com/quad400/stream/tree/main/stream-docs/content/developers/quickstart.mdx).

## Prerequisites

- Stream backend running (`stream-backend` on port 8080)
- Sandbox project with API key (`sk_test_`) scoped for `streams:write` and `rooms:join`

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `STREAMFLOW_SECRET_KEY` | Yes | `sk_test_...` from the developer dashboard |
| `STREAMFLOW_API_URL` | No | Default `http://localhost:8080` |

## Run

```bash
cd examples/node-quickstart
npm install
STREAMFLOW_SECRET_KEY=sk_test_... npm start
```

## Expected output

```
Stream ID: 550e8400-e29b-41d4-a716-446655440000
Embed token: eyJhbG...
Expires at: 2026-06-29T13:00:00Z
```

## curl equivalent

```bash
curl -s -X POST "$STREAMFLOW_API_URL/api/v1/streams" \
  -H "Authorization: Bearer $STREAMFLOW_SECRET_KEY" \
  -H "Content-Type: application/json" \
  -d '{"title":"Weekly standup","mode":"room","visibility":"private"}'
```

## CI

From repo root: `./scripts/verify-quickstart.sh` (syntax-check always; live API when `STREAMFLOW_SECRET_KEY` is set).
