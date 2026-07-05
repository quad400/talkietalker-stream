# @streamflow/react

React SDK for StreamFlow live rooms and broadcast players.

## Install

```bash
npm install @streamflow/react @streamflow/node
```

Peer dependencies: `react` and `react-dom` (>= 18).

## Quick start

Set three keys — no manual URLs:

```bash
# Server (.env.local)
STREAMFLOW_SECRET_KEY=sk_test_...
STREAMFLOW_WEBHOOK_SECRET=whsec_...

# Browser
NEXT_PUBLIC_STREAMFLOW_PUBLISH_KEY=pk_test_...
```

**Server** (`app/api/streamflow/[...route]/route.ts`):

```ts
import { streamflowHandlers } from '@streamflow/node/next'
export const { POST } = streamflowHandlers()
```

**Client**:

```tsx
import { StreamFlow, StreamFlowRoom } from '@streamflow/react'
import '@streamflow/react/styles.css'

export function Meeting({ roomId }: { roomId: string }) {
  return (
    <StreamFlow>
      <StreamFlowRoom
        roomId={roomId}
        participant={{ name: 'Guest' }}
        onLeave={() => console.log('left')}
      />
    </StreamFlow>
  )
}
```

## Exports

| Import | Contents |
|--------|----------|
| `@streamflow/react` | `StreamFlow`, `StreamFlowRoom`, `StreamFlowClient` |
| `@streamflow/react/room` | `useRoomSession` |
| `@streamflow/react/signaling` | `useSignalingSocket`, `useBroadcastViewer` |

See [ARCHITECTURE.md](./ARCHITECTURE.md) for internals.
