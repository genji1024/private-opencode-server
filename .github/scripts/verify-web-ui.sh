#!/bin/bash
set -euo pipefail

PORT="${1:-4399}"

echo "Starting Next.js app on port $PORT..."

npx next start --port "$PORT" &
NEXT_PID=$!
echo "NEXT_PID=$NEXT_PID" >> "$GITHUB_ENV"
echo "NEXT_PORT=$PORT" >> "$GITHUB_ENV"

for i in $(seq 1 30); do
  HTTP_CODE=$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:$PORT" 2>/dev/null || echo "000")
  if [ "$HTTP_CODE" != "000" ]; then
    echo "Next.js app is ready (attempt $i, HTTP $HTTP_CODE)"
    BODY=$(curl -s "http://127.0.0.1:$PORT" 2>/dev/null || true)
    if echo "$BODY" | grep -qi "<html"; then
      echo "Web UI content verified: returns valid HTML"
    else
      echo "WARNING: Web UI returned HTTP $HTTP_CODE but content may not be HTML"
    fi
    exit 0
  fi
  sleep 1
done

echo "ERROR: Next.js app did not become ready within 30 seconds"
exit 1
