# Sprint 05 — Client SDK & Embeddables

**Duration:** 3 weeks  
**Goal:** Developers embed live rooms and broadcast players in their apps without reimplementing WebRTC.  
**Depends on:** Sprint 02, Sprint 04  
**Blocks:** Sprint 07, 09

---

## Objectives

1. Extract signaling logic from `talkietalker-stream-web` into `@talkietalker/stream-react`
2. Ship `<TalkieTalkerRoom />` and `<TalkieTalkerPlayer />` components
3. iframe embed route for non-React apps
4. CORS + embed token integration
5. Minimal bundle size (&lt; 150kb gzip for room core)

---

## Tasks

### Task 05.1 — Extract signaling package

**Estimate:** 13 pts

Move (copy then refactor) from `talkietalker-stream-web/src/features/signaling/`:

| Module | Package path |
|--------|--------------|
| `use-room-session.ts` | `@talkietalker/stream-react/room/useRoomSession` |
| `use-signaling-socket.ts` | `@talkietalker/stream-react/signaling` |
| `peer-connection-manager.ts` | `@talkietalker/stream-react/webrtc` |
| `media-device-manager.ts` | `@talkietalker/stream-react/media` |
| `types.ts`, `helpers.ts` | `@talkietalker/stream-react/core` |

- [ ] `talkietalker-stream-web` imports from `@talkietalker/stream-react` (dogfood)
- [ ] No dependency on Next.js or dashboard components
- [ ] Peer deps: `react >= 18`

---

### Task 05.2 — TalkieTalkerRoom component

**Estimate:** 8 pts

```tsx
import { TalkieTalkerRoom } from '@talkietalker/stream-react'

<TalkieTalkerRoom
  roomId="uuid"
  token={embedToken}
  wsUrl="wss://api.talkietalker.stream/api/v1/ws"
  onLeave={() => {}}
  theme="dark"
  features={{
    chat: true,
    screenShare: true,
    waitingRoom: false,
  }}
/>
```

Extract UI from:
- `talkietalker-stream-web/src/components/dashboard/rooms/live-room/participant-video-grid.tsx`
- `talkietalker-stream-web/src/components/dashboard/rooms/live-room/video-tile.tsx`
- `talkietalker-stream-web/src/components/dashboard/rooms/live-room/meeting-settings-panel.tsx`

Provide **default UI** + **headless** mode (`renderParticipant`, slots)

---

### Task 05.3 — TalkieTalkerPlayer component

**Estimate:** 5 pts

Broadcast viewer for `mode: broadcast`:

```tsx
<TalkieTalkerPlayer
  streamId="uuid"
  token={embedToken}
  onPaymentRequired={(info) => redirectToCheckout(info)}
/>
```

Reuse: `talkietalker-stream-web/src/features/signaling/use-broadcast-viewer.ts`

---

### Task 05.4 — iframe embed host

**Estimate:** 5 pts

New routes in `talkietalker-stream-web` or dedicated `stream-embed` app:

```
/embed/room/{id}?token=...
/embed/player/{id}?token=...
```

- [ ] `postMessage` API for parent page: `talkietalker-stream:joined`, `talkietalker-stream:left`, `talkietalker-stream:error`
- [ ] CSP headers documented for integrators
- [ ] Responsive layout, minimal chrome

---

### Task 05.5 — Configuration & theming API

**Estimate:** 3 pts

```tsx
<TalkieTalkerStreamProvider
  wsUrl={...}
  locale="en"
  theme={{
    primaryColor: '#6366f1',
    borderRadius: '8px',
  }}
>
```

CSS variables for white-label (full theming in Sprint 09)

---

### Task 05.6 — Bundle & browser support

**Estimate:** 3 pts

- [ ] Target: Chrome, Firefox, Safari, Edge (last 2 versions)
- [ ] Document WebRTC requirements (HTTPS, permissions)
- [ ] Tree-shakeable exports
- [ ] Storybook or Ladle for component dev

---

## Implementation prompt

```
Sprint 05 — Client SDK.

Extract use-room-session and dependencies into packages/talkietalker-stream-node/stream-react.

Requirements:
1. @talkietalker/stream-react exports TalkieTalkerRoom (default UI) and useRoomSession (headless)
2. talkietalker-stream-web live meet page must use the package — no duplicate logic
3. Add /embed/room/[id] page with postMessage bridge
4. Token passed as prop, never read from URL in React SDK (iframe route may use query param)

Do not import from @/src/components/dashboard in the package.
Keep adaptive video quality and reconnect behavior intact.
```

---

## Acceptance criteria

- [ ] Third-party React app embeds room in &lt; 20 lines
- [ ] iframe embed works from static HTML page
- [ ] `talkietalker-stream-web` meet live page uses `@talkietalker/stream-react`
- [ ] Bundle analyzed; document size in README

---

## Demo script

```bash
cd examples/stream-react-embed-room
npm install @talkietalker/stream-react @talkietalker/stream-sdk
npm run dev
# Open localhost:5173 — room joins with token from server script
```

**Next:** [Sprint 06 — Developer dashboard](./sprint-06-developer-dashboard.md)
