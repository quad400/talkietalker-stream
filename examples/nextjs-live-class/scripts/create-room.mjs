import { StreamFlow } from "@streamflow/node"

const secretKey = process.env.STREAMFLOW_SECRET_KEY
if (!secretKey) {
  console.error("Set STREAMFLOW_SECRET_KEY (sk_test_...)")
  process.exit(1)
}

const sf = new StreamFlow({ apiKey: secretKey })

const stream = await sf.streams.create({
  title: "Next.js live class",
  mode: "room",
  visibility: "private",
})

console.log("\nRoom created.\n")
console.log(`Open: http://localhost:3002/room/${stream.id}\n`)
