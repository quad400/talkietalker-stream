# Changelog

## 0.1.0

- Initial release: `StreamFlowProvider`, `StreamFlowRoom`, `StreamFlowPlayer`
- WebRTC signaling extracted from stream-web (`useRoomSession`, `useSignalingSocket`, `useBroadcastViewer`)
- Embed token auth via `token` prop
- Default room UI (grid, controls) and player UI
- postMessage embed bridge (`streamflow:joined`, `streamflow:left`, `streamflow:error`)
- Subpath exports: `/room`, `/signaling`, `/webrtc`, `/media`, `/core`
