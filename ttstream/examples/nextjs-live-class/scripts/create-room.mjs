import { TalkieTalkerStream } from "@talkietalker/stream-sdk"

const secretKey = process.env.TALKIETALKER_STREAM_SECRET_KEY
if (!secretKey) {
  console.error("Set TALKIETALKER_STREAM_SECRET_KEY (sk_test_...)")
  process.exit(1)
}

const sf = new TalkieTalkerStream({
  secretKey,
  baseURL: process.env.TALKIETALKER_STREAM_API_URL,
})

const stream = await sf.streams.create({
  title: "Next.js live class",
  mode: "room",
  visibility: "private",
  isRecordingEnabled: process.env.TALKIETALKER_STREAM_RECORDING_ENABLED === "true",
})

console.log("\nRoom created.\n")
console.log(`Stream ID: ${stream.id}`)
console.log(`Add to Prisma or open: http://localhost:3002/room/${stream.id}\n`)
