#!/usr/bin/env bash
# Run the production container locally (requires .env with DATABASE_URL pointing to a reachable DB).
# Usage: ./scripts/run-production-local.sh [port]
# Example: ./scripts/run-production-local.sh 3000

set -e
cd "$(dirname "$0")/.."
PORT="${1:-3000}"
IMAGE="${IMAGE:-ticket-concierge:local}"
if ! docker image inspect "$IMAGE" &>/dev/null; then
  echo "Image $IMAGE not found. Run: ./scripts/build-container.sh $IMAGE"
  exit 1
fi
docker run --rm -p "$PORT:3000" -e PORT=3000 --env-file .env "$IMAGE"
echo "App running at http://localhost:$PORT (stop with Ctrl+C)"
