#!/bin/bash
set -euo pipefail

URL="${1:-http://localhost:3000}"
TIMEOUT_SEC="${2:-60}"
INTERVAL=2
MAX_ATTEMPTS=$(( TIMEOUT_SEC / INTERVAL ))

echo "Waiting for service at ${URL} to start..."

for i in $(seq 1 "${MAX_ATTEMPTS}"); do
  HTTP_CODE=$(curl -s -o /dev/null -w '%{http_code}' "${URL}" 2>/dev/null || echo "000")
  if [ "$HTTP_CODE" != "000" ]; then
    echo "Service is up! (HTTP status: ${HTTP_CODE})"
    docker compose ps
    exit 0
  fi
  sleep "${INTERVAL}"
done

echo "Service failed to start within ${TIMEOUT_SEC} seconds"
docker compose logs
exit 1
