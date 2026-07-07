# @talkietalker/stream-react — architecture

## Flow

1. `<TalkieTalkerStream>` creates or accepts a `TalkieTalkerStreamClient` (reads `NEXT_PUBLIC_TALKIETALKER_STREAM_PUBLISH_KEY`)
2. `<TalkieTalkerRoom>` calls `client.getConnection(roomId, participant)`
3. Client POSTs to `/api/talkietalker-stream/token` with `X-TalkieTalker-Stream-Publish-Key`
4. Server returns `{ token, expiresAt, wsUrl }` — browser never configures URLs
5. Room connects WebSocket using returned `wsUrl` and `token`

## Dashboard sessions

For first-party dashboard rooms (session JWT, not embed token), pass `getAccessToken` to `<TalkieTalkerStream>`:

```tsx
<TalkieTalkerStream getAccessToken={fetchAccessToken}>
  <LiveRoomPage />
</TalkieTalkerStream>
```

`useRoomSession` resolves the token via `resolveAccessToken()`.

## iframe embeds

Pass a pre-minted token via client options:

```tsx
<TalkieTalkerStream client={TalkieTalkerStreamClient.create({ publishKey, initialToken: urlToken })}>
```

## Security

- Only publish keys in browser env vars
- Token cache is in-memory per client instance
- Refresh 60s before JWT expiry
