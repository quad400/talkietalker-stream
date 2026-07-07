# @talkietalker/stream-react

React SDK for TalkieTalkerStream live rooms and broadcast players.

## Install

```bash
npm install @talkietalker/stream-react @talkietalker/stream-sdk
```

Peer dependencies: `react` and `react-dom` (>= 18).

## Quick start

Set three keys — no manual URLs:

```bash
# Server (.env.local)
TALKIETALKER_STREAM_SECRET_KEY=sk_test_...
TALKIETALKER_STREAM_WEBHOOK_SECRET=whsec_...

# Browser
NEXT_PUBLIC_TALKIETALKER_STREAM_PUBLISH_KEY=pk_test_...
```

**Server** (`app/api/talkietalker-stream/[...route]/route.ts`):

```ts
import { talkieTalkerStreamHandlers } from '@talkietalker/stream-sdk/next'
export const { POST } = talkieTalkerStreamHandlers()
```

**Client**:

```tsx
import { TalkieTalkerStream, TalkieTalkerRoom } from '@talkietalker/stream-react'
import '@talkietalker/stream-react/styles.css'

export function Meeting({ roomId }: { roomId: string }) {
  return (
    <TalkieTalkerStream>
      <TalkieTalkerRoom
        roomId={roomId}
        participant={{ name: 'Guest' }}
        onLeave={() => console.log('left')}
      />
    </TalkieTalkerStream>
  )
}
```

## Exports

| Import | Contents |
|--------|----------|
| `@talkietalker/stream-react` | `TalkieTalkerStream`, `TalkieTalkerRoom`, `TalkieTalkerStreamClient` |
| `@talkietalker/stream-react/room` | `useRoomSession` |
| `@talkietalker/stream-react/signaling` | `useSignalingSocket`, `useBroadcastViewer` |

See [ARCHITECTURE.md](./ARCHITECTURE.md) for internals.
