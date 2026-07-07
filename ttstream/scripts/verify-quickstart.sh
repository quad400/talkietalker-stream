#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "==> Syntax-checking quickstart example scripts"
node --check "$ROOT/examples/stream-sdk-quickstart/create-room.js"
node --check "$ROOT/examples/stream-react-embed-room/server/create-token.js"

if [[ -z "${TALKIETALKER_STREAM_SECRET_KEY:-}" ]]; then
  echo "==> TALKIETALKER_STREAM_SECRET_KEY not set — skipping live API checks"
  exit 0
fi

API_URL="${TALKIETALKER_STREAM_API_URL:-http://localhost:8080}"

echo "==> Installing example dependencies (workspace)"
npm install --workspace=examples/stream-sdk-quickstart --workspace=examples/stream-react-embed-room --ignore-scripts 2>/dev/null || npm install

echo "==> Running examples/stream-sdk-quickstart/create-room.js"
OUTPUT="$(
  cd "$ROOT/examples/stream-sdk-quickstart" &&
    TALKIETALKER_STREAM_API_URL="$API_URL" TALKIETALKER_STREAM_SECRET_KEY="$TALKIETALKER_STREAM_SECRET_KEY" node create-room.js
)"
echo "$OUTPUT"

if ! echo "$OUTPUT" | grep -qE 'Stream ID: [0-9a-f-]{36}'; then
  echo "ERROR: stdout missing stream UUID (expected 'Stream ID: ...')"
  exit 1
fi

if ! echo "$OUTPUT" | grep -qE 'Embed token: eyJ'; then
  echo "ERROR: stdout missing embed JWT (expected 'Embed token: eyJ...')"
  exit 1
fi

echo "==> Running examples/stream-react-embed-room/server/create-token.js"
TOKEN_OUTPUT="$(
  cd "$ROOT/examples/stream-react-embed-room" &&
    TALKIETALKER_STREAM_API_URL="$API_URL" TALKIETALKER_STREAM_SECRET_KEY="$TALKIETALKER_STREAM_SECRET_KEY" node server/create-token.js
)"
echo "$TOKEN_OUTPUT"

if ! echo "$TOKEN_OUTPUT" | grep -qE 'VITE_EMBED_TOKEN=eyJ'; then
  echo "ERROR: stdout missing VITE_EMBED_TOKEN=eyJ..."
  exit 1
fi

echo "==> Quickstart verification passed"
