import express from "express"
import { talkieTalkerStreamRouter } from "@talkietalker/stream-sdk/express"

const app = express()
const PORT = Number(process.env.PORT ?? 3001)

app.use("/api/talkietalker-stream", talkieTalkerStreamRouter())

app.listen(PORT, () => {
  console.log(`TalkieTalkerStream API listening on http://localhost:${PORT}/api/talkietalker-stream`)
})
