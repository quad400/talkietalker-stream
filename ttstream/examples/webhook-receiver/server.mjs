import express from "express"
import { talkieTalkerStreamRouter } from "@talkietalker/stream-sdk/express"

const app = express()
const PORT = process.env.PORT || 3456

app.use("/api/talkietalker-stream", talkieTalkerStreamRouter())

app.get("/health", (_req, res) => {
  res.json({ ok: true })
})

app.listen(PORT, () => {
  console.log(`Webhook receiver listening on http://localhost:${PORT}/api/talkietalker-stream/webhooks`)
})
