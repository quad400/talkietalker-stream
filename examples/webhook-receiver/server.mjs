import express from "express"
import { streamflowRouter } from "@streamflow/node/express"

const app = express()
const PORT = process.env.PORT || 3456

app.use("/api/streamflow", streamflowRouter())

app.get("/health", (_req, res) => {
  res.json({ ok: true })
})

app.listen(PORT, () => {
  console.log(`Webhook receiver listening on http://localhost:${PORT}/api/streamflow/webhooks`)
})
