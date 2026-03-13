#!/usr/bin/env bash
# Build the production Docker image locally (same image Cloud Build produces).
# Usage: ./scripts/build-container.sh [tag]
# Example: ./scripts/build-container.sh my-tag

set -e
cd "$(dirname "$0")/.."
TAG="${1:-ticket-concierge:local}"
docker build -t "$TAG" .
echo "Built image: $TAG"
