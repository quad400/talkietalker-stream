# StreamFlow webhook receiver (example)

Minimal Express server that verifies `X-StreamFlow-Signature` and logs events. Optional step 6 of the [developer quickstart](https://github.com/quad400/stream/tree/main/stream-docs/content/developers/quickstart.mdx).

## Prerequisites

- Stream API + **worker** (`cmd/worker`) running for deliveries
- HTTPS URL reachable from your deployment (use ngrok locally)

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `WEBHOOK_SECRET` | Yes | `whsec_test_...` from webhook create response |
| `PORT` | No | Default `3456` |

## Setup

```bash
cd examples/webhook-receiver
npm install
export WEBHOOK_SECRET=whsec_test_...
npm start
```

## Expose with ngrok

```bash
ngrok http 3456
```

Copy the HTTPS URL (e.g. `https://abcd.ngrok-free.app/webhooks`).

## Register webhook

```bash
curl -X POST localhost:8080/api/v1/projects/$PROJ/webhooks \
  -H "Authorization: Bearer $SK" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://abcd.ngrok-free.app/webhooks","enabled_events":["room.participant.joined","webhook.test"]}'
```

Save the returned `secret` into `WEBHOOK_SECRET`.

## Test

```bash
curl -X POST localhost:8080/api/v1/webhooks/$WEBHOOK_ID/test \
  -H "Authorization: Bearer $SK"
```

Join a sandbox room to see `room.participant.joined` in the receiver logs.

**Note:** Sandbox projects cap webhook deliveries at [1,000/day](/docs/developers/sandbox#webhook-deliveries).
