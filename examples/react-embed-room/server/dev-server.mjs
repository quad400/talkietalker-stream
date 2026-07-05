import express from "express"
import { streamflowRouter } from "@streamflow/node/express"

const app = express()
const PORT = Number(process.env.PORT ?? 3001)

app.use("/api/streamflow", streamflowRouter())

app.listen(PORT, () => {
  console.log(`StreamFlow API listening on http://localhost:${PORT}/api/streamflow`)
})
