import { PrismaClient } from "@prisma/client"
import { TalkieTalkerStream } from "@talkietalker/stream-sdk"

const prisma = new PrismaClient()

const secretKey = process.env.TALKIETALKER_STREAM_SECRET_KEY
if (!secretKey) {
  console.error("Set TALKIETALKER_STREAM_SECRET_KEY")
  process.exit(1)
}

const sf = new TalkieTalkerStream({
  secretKey,
  baseURL: process.env.TALKIETALKER_STREAM_API_URL,
})

const hostName = process.env.SEED_HOST_NAME ?? "Instructor"
const title = process.env.SEED_CLASS_TITLE ?? "Demo live class"

const stream = await sf.streams.create({
  title,
  description: "Seeded from scripts/seed.mjs",
  mode: "room",
  visibility: "private",
  isRecordingEnabled: process.env.TALKIETALKER_STREAM_RECORDING_ENABLED === "true",
})

const liveClass = await prisma.liveClass.create({
  data: {
    title,
    description: "Seeded demo class — enroll as a student, then join the room.",
    streamId: stream.id,
    hostName,
    status: stream.status ?? "idle",
  },
})

console.log("\nSeeded live class:")
console.log(`  Class:  http://localhost:3002/class/${liveClass.id}`)
console.log(`  Host:   ${hostName}`)
console.log(`  Stream: ${stream.id}\n`)

await prisma.$disconnect()
