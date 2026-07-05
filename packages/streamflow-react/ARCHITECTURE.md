# @streamflow/react — architecture

## Flow

1. `<StreamFlow>` creates or accepts a `StreamFlowClient` (reads `NEXT_PUBLIC_STREAMFLOW_PUBLISH_KEY`)
2. `<StreamFlowRoom>` calls `client.getConnection(roomId, participant)`
3. Client POSTs to `/api/streamflow/token` with `X-StreamFlow-Publish-Key`
4. Server returns `{ token, expiresAt, wsUrl }` — browser never configures URLs
5. Room connects WebSocket using returned `wsUrl` and `token`

## Dashboard sessions

For first-party dashboard rooms (session JWT, not embed token), pass `getAccessToken` to `<StreamFlow>`:

```tsx
<StreamFlow getAccessToken={fetchAccessToken}>
  <LiveRoomPage />
</StreamFlow>
```

`useRoomSession` resolves the token via `resolveAccessToken()`.

## iframe embeds

Pass a pre-minted token via client options:

```tsx
<StreamFlow client={StreamFlowClient.create({ publishKey, initialToken: urlToken })}>
```

## Security

- Only publish keys in browser env vars
- Token cache is in-memory per client instance
- Refresh 60s before JWT expiry
