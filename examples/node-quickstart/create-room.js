import { StreamFlow } from '@streamflow/node'

const apiKey = process.env.STREAMFLOW_SECRET_KEY
if (!apiKey) {
  console.error('Set STREAMFLOW_SECRET_KEY (e.g. sk_test_...)')
  process.exit(1)
}

const baseURL = process.env.STREAMFLOW_API_URL ?? 'http://localhost:8080'

const sf = new StreamFlow({ apiKey, baseURL })

const stream = await sf.streams.create(
  {
    title: 'Weekly standup',
    mode: 'room',
    visibility: 'private',
  },
  { idempotencyKey: `standup-${new Date().toISOString().slice(0, 10)}` },
)

const token = await sf.embedTokens.create({
  resourceType: 'room',
  resourceId: stream.id,
  participant: { name: 'Alex' },
})

console.log('Stream ID:', stream.id)
console.log('Embed token:', token.token)
console.log('Expires at:', token.expires_at)
