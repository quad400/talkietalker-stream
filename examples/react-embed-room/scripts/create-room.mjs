import { writeFileSync, readFileSync, existsSync } from "node:fs"
import { resolve } from "node:path"
import { StreamFlow } from "@streamflow/node"

const secretKey = process.env.STREAMFLOW_SECRET_KEY
if (!secretKey) {
  console.error("Set STREAMFLOW_SECRET_KEY (sk_test_...)")
  process.exit(1)
}

const sf = new StreamFlow({ apiKey: secretKey })

const stream = await sf.streams.create({
  title: "React live room",
  mode: "room",
  visibility: "private",
})

const envPath = resolve(process.cwd(), ".env")
let env = existsSync(envPath) ? readFileSync(envPath, "utf8") : ""

const setVar = (key, value) => {
  const line = `${key}=${value}`
  const pattern = new RegExp(`^${key}=.*$`, "m")
  env = pattern.test(env) ? env.replace(pattern, line) : `${env.trimEnd()}\n${line}\n`
}

setVar("VITE_ROOM_ID", stream.id)

writeFileSync(envPath, env.startsWith("\n") ? env.trimStart() : env)

console.log("\nRoom created and saved to .env\n")
console.log(`VITE_ROOM_ID=${stream.id}`)
console.log("\nRun: npm run dev\n")
