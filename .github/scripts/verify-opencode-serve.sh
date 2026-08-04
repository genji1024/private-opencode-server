#!/bin/bash
set -euo pipefail

PORT="${PORT:-4199}"

echo "Verifying opencode serve stability on port $PORT..."

HTTP_CODE=$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:$PORT" 2>/dev/null || echo "000")
echo "Initial HTTP status: $HTTP_CODE"

if [ "$HTTP_CODE" = "000" ]; then
  echo "ERROR: opencode serve did not start"
  exit 1
fi

sleep 5

HTTP_CODE2=$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:$PORT" 2>/dev/null || echo "000")
if [ "$HTTP_CODE2" = "000" ]; then
  echo "ERROR: opencode serve stopped unexpectedly"
  exit 1
fi

echo "opencode serve is stable (HTTP $HTTP_CODE2)"
