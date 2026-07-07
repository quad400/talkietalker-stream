# Changelog

## 0.1.0

- Initial release: `TalkieTalkerStreamProvider`, `TalkieTalkerRoom`, `TalkieTalkerPlayer`
- WebRTC signaling extracted from talkietalker-stream-web (`useRoomSession`, `useSignalingSocket`, `useBroadcastViewer`)
- Embed token auth via `token` prop
- Default room UI (grid, controls) and player UI
- postMessage embed bridge (`talkietalker-stream:joined`, `talkietalker-stream:left`, `talkietalker-stream:error`)
- Subpath exports: `/room`, `/signaling`, `/webrtc`, `/media`, `/core`
