import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { TalkieTalkerStream, TalkieTalkerRoom } from "@talkietalker/stream-react"
import "@talkietalker/stream-react/styles.css"

const roomId = import.meta.env.VITE_ROOM_ID ?? ""

function App() {
  if (!roomId) {
    return (
      <p style={{ padding: 24, fontFamily: "system-ui" }}>
        Set VITE_ROOM_ID in .env (create a room with examples/stream-sdk-quickstart).
      </p>
    )
  }

  return (
    <TalkieTalkerStream>
      <TalkieTalkerRoom
        roomId={roomId}
        participant={{ name: "Demo guest" }}
        theme="dark"
        onLeave={() => console.log("left room")}
      />
    </TalkieTalkerStream>
  )
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
