#!/bin/bash
set -euo pipefail

PORT="${1:-4199}"

mkdir -p "$HOME/.config/opencode" "$HOME/.local/share/opencode"

./node_modules/.bin/opencode serve --port "$PORT" --print-logs &
SERVER_PID=$!

echo "SERVER_PID=$SERVER_PID" >> "$GITHUB_ENV"
echo "PORT=$PORT" >> "$GITHUB_ENV"

echo "Waiting for opencode serve (PID: $SERVER_PID) on port $PORT..."

for i in $(seq 1 30); do
  HTTP_CODE=$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:$PORT" 2>/dev/null || echo "000")
  if [ "$HTTP_CODE" != "000" ]; then
    echo "opencode serve is ready (attempt $i, HTTP $HTTP_CODE)"
    exit 0
  fi
  sleep 1
done

echo "ERROR: opencode serve did not become ready within 30 seconds"
exit 1
