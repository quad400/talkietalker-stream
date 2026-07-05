import type { Story } from "@ladle/react"
import { StreamFlow } from "../components/streamflow.js"
import { RoomControls } from "../components/room-controls.js"
import { RoomVideoGrid } from "../components/room-video-grid.js"
import type { SignalingParticipant } from "../signaling/types.js"

const mockParticipants: SignalingParticipant[] = [
  {
    id: "local",
    username: "Alex",
    stream: null,
    isLocal: true,
    isHost: true,
    audioMuted: false,
    videoOff: false,
    isScreenSharing: false,
    handRaised: false,
    reaction: null,
    connectionQuality: "good",
  },
  {
    id: "remote-1",
    username: "Jordan",
    stream: null,
    isLocal: false,
    isHost: false,
    audioMuted: true,
    videoOff: false,
    isScreenSharing: false,
    handRaised: false,
    reaction: null,
    connectionQuality: "good",
  },
]

export const GridTwoTiles: Story = () => (
  <StreamFlow getAccessToken={async () => null}>
    <div style={{ minHeight: 400, background: "#0f172a", padding: 16 }}>
      <RoomVideoGrid participants={mockParticipants} activeSpeakerId={null} />
      <RoomControls
        micMuted={false}
        videoOff={false}
        isScreenSharing={false}
        onToggleMic={() => undefined}
        onToggleVideo={() => undefined}
        onToggleScreenShare={() => undefined}
        onLeave={() => undefined}
      />
    </div>
  </StreamFlow>
)

export const Connecting: Story = () => (
  <div
    style={{
      minHeight: 300,
      display: "grid",
      placeItems: "center",
      background: "#0f172a",
      color: "#f8fafc",
      fontFamily: "system-ui",
    }}
  >
    Connecting…
  </div>
)

export const ErrorState: Story = () => (
  <div style={{ padding: 24, color: "#f87171", background: "#0f172a", fontFamily: "system-ui" }}>
    Connection failed: Unable to reach signaling server.
  </div>
)
