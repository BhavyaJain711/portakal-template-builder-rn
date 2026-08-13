#!/usr/bin/env bash
# Pack the three local packages into .packed/ so the Expo example can consume
# them the way a published consumer would (tarball → dist only, peers
# uninstalled). Run from the repo root (the directory containing this file).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
PACKED="$ROOT/.packed"
mkdir -p "$PACKED"

# Build first so dist is fresh.
for d in portakal-lite portakal-template portakal-template-builder-rn; do
  (cd "$ROOT/$d" && npm run build >/dev/null)
  npm pack "$ROOT/$d" --pack-destination "$PACKED" >/dev/null
done

echo "Packed into $PACKED:"
ls -1 "$PACKED"/*.tgz
