import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { StreamFlow, StreamFlowRoom } from "@streamflow/react"
import "@streamflow/react/styles.css"

const roomId = import.meta.env.VITE_ROOM_ID ?? ""

function App() {
  if (!roomId) {
    return (
      <p style={{ padding: 24, fontFamily: "system-ui" }}>
        Set VITE_ROOM_ID in .env (create a room with examples/node-quickstart).
      </p>
    )
  }

  return (
    <StreamFlow>
      <StreamFlowRoom
        roomId={roomId}
        participant={{ name: "Demo guest" }}
        theme="dark"
        onLeave={() => console.log("left room")}
      />
    </StreamFlow>
  )
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
