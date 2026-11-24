#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

if ! command -v pnpm >/dev/null 2>&1; then
  echo "pnpm is required. Install pnpm, then run this script again." >&2
  exit 1
fi

if [[ ! -d node_modules ]]; then
  echo "Installing project dependencies..."
  pnpm install
fi

echo "Starting Sheba Shathi at http://localhost:3100"
if curl -fsS http://localhost:3100 >/dev/null 2>&1; then
  echo "Sheba Shathi is already running at http://localhost:3100"
  exit 0
fi

pnpm exec next dev --port 3100
