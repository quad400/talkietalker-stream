import { gzipSync } from "node:zlib"
import { readFileSync, readdirSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "dist")

function gzipSize(bytes) {
  return gzipSync(bytes).length
}

const jsFiles = readdirSync(root)
  .filter((f) => f.endsWith(".js") && !f.endsWith(".js.map"))
  .sort()

console.log("@talkietalker/stream-react bundle sizes (gzip, excluding react peer deps)\n")

let total = 0
for (const file of jsFiles) {
  const buf = readFileSync(join(root, file))
  const gz = gzipSize(buf)
  total += gz
  console.log(`  ${file.padEnd(28)} ${(gz / 1024).toFixed(1)} KB`)
}

console.log(`\n  ${"total JS (all chunks)".padEnd(28)} ${(total / 1024).toFixed(1)} KB`)
console.log("\nOpen dist/bundle-stats.html for the full visualizer report.")
