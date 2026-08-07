#!/bin/bash
set -euo pipefail

NEXT_PORT="${1:-4399}"
OPENCODE_SERVER_URL="${OPENCODE_SERVER_URL:-http://127.0.0.1:4096}"
ADMIN_USERNAME="${ADMIN_USERNAME:-admin}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-test-admin-password}"
DATA_DIR="${DATA_DIR:-$(mktemp -d)}"

BASE_URL="http://127.0.0.1:${NEXT_PORT}"
COOKIE="auth_token=$(echo -n "${ADMIN_USERNAME}:${ADMIN_PASSWORD}" | base64 -w0)"

echo "Starting Next.js app on port ${NEXT_PORT}..."
echo "OPENCODE_SERVER_URL=${OPENCODE_SERVER_URL}"

OPENCODE_SERVER_URL="${OPENCODE_SERVER_URL}" \
  ADMIN_USERNAME="${ADMIN_USERNAME}" \
  ADMIN_PASSWORD="${ADMIN_PASSWORD}" \
  DATA_DIR="${DATA_DIR}" \
  npx next start --port "${NEXT_PORT}" &
NEXT_PID=$!
echo "NEXT_PID=$NEXT_PID" >> "$GITHUB_ENV"
echo "NEXT_PORT=$NEXT_PORT" >> "$GITHUB_ENV"

for i in $(seq 1 30); do
  HTTP_CODE=$(curl -s -o /dev/null -w '%{http_code}' -b "$COOKIE" "$BASE_URL/opencode" 2>/dev/null || true)
  if [ "$HTTP_CODE" = "200" ]; then
    echo "Next.js app is ready (attempt $i, HTTP $HTTP_CODE)"
    break
  fi
  sleep 1
done

if [ "$HTTP_CODE" != "200" ]; then
  echo "ERROR: Next.js app did not become ready within 30 seconds (last HTTP $HTTP_CODE)"
  exit 1
fi

BODY=$(curl -s -b "$COOKIE" "$BASE_URL/opencode")
if [ -z "$BODY" ]; then
  echo "ERROR: /opencode returned an empty body"
  exit 1
fi

if echo "$BODY" | grep -q "CLI が見つかりません"; then
  echo "ERROR: /opencode shows the CLI-not-found error"
  exit 1
fi

STATUS=$(curl -s -b "$COOKIE" "$BASE_URL/api/opencode-serve")
if ! echo "$STATUS" | grep -q '"running":true'; then
  echo "ERROR: /api/opencode-serve does not report running=true"
  echo "Response: $STATUS"
  exit 1
fi

echo "Web UI verified: /opencode returns HTTP 200, no CLI-not-found error, server connected"
