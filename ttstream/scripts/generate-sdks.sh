#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

PYTHON="${ROOT}/scripts/.venv/bin/python"
if [[ ! -x "$PYTHON" ]]; then
  python3 -m venv "${ROOT}/scripts/.venv"
  "${ROOT}/scripts/.venv/bin/pip" install -q pyyaml
fi

"$PYTHON" scripts/openapi-filter-sdk.py

if ! command -v oapi-codegen >/dev/null 2>&1; then
  go install github.com/oapi-codegen/oapi-codegen/v2/cmd/oapi-codegen@v2.4.1
fi

mkdir -p packages/talkietalker-stream-go/streamflow packages/talkietalker-stream-node/src/generated

TMP_GEN="$(mktemp)"
oapi-codegen -package streamflow -generate types,client \
  talkietalker-stream-web/docs/openapi-sdk.yaml > "$TMP_GEN" 2>&1
grep -v '^WARNING:' "$TMP_GEN" > packages/talkietalker-stream-go/streamflow/client.gen.go
rm -f "$TMP_GEN"
# Generated file is kept for drift checks; hand-written SDK does not import it.
{
  echo "//go:build ignore"
  echo ""
  cat packages/talkietalker-stream-go/streamflow/client.gen.go
} > packages/talkietalker-stream-go/streamflow/client.gen.go.tmp
mv packages/talkietalker-stream-go/streamflow/client.gen.go.tmp packages/talkietalker-stream-go/streamflow/client.gen.go

npx --yes openapi-typescript@7.6.1 talkietalker-stream-web/docs/openapi-sdk.yaml \
  -o packages/talkietalker-stream-node/src/generated/schema.d.ts

echo "SDK artifacts generated."
