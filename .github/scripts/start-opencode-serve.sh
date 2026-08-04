#!/bin/bash
set -euo pipefail

PORT="${1:-4096}"

mkdir -p "$HOME/.config/opencode" "$HOME/.local/share/opencode"

if [ -n "${OPENCODE_API_KEY:-}" ]; then
  cat > "$HOME/.local/share/opencode/auth.json" << EOF
{
  "opencode-go": {
    "type": "api",
    "key": "$OPENCODE_API_KEY"
  }
}
EOF
  chmod 600 "$HOME/.local/share/opencode/auth.json"
fi

if [ -n "${GITHUB_PERSONAL_ACCESS_TOKEN:-}" ] || [ -n "${STREAMABLE_HTTP_AUTH_TOKEN:-}" ]; then
  cat > "$HOME/.config/opencode/opencode.jsonc" << 'EOF'
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
EOF

  if [ -n "${GITHUB_PERSONAL_ACCESS_TOKEN:-}" ]; then
    cat >> "$HOME/.config/opencode/opencode.jsonc" << 'EOF'
    "github": {
      "type": "remote",
      "url": "https://api.githubcopilot.com/mcp/",
      "headers": {
        "Authorization": "Bearer {env:GITHUB_PERSONAL_ACCESS_TOKEN}"
      },
      "oauth": false
    }
EOF
  fi

  if [ -n "${STREAMABLE_HTTP_AUTH_TOKEN:-}" ]; then
    if [ -n "${GITHUB_PERSONAL_ACCESS_TOKEN:-}" ]; then
      echo "    ," >> "$HOME/.config/opencode/opencode.jsonc"
    fi
    cat >> "$HOME/.config/opencode/opencode.jsonc" << 'EOF'
    "gitlab": {
      "type": "remote",
      "url": "http://gitlab-mcp:3002/mcp",
      "headers": {
        "Authorization": "Bearer {env:STREAMABLE_HTTP_AUTH_TOKEN}"
      },
      "oauth": false
    }
EOF
  fi

  cat >> "$HOME/.config/opencode/opencode.jsonc" << 'EOF'
  },
  "permission": {
    "*": "allow"
  }
}
EOF
fi

./node_modules/.bin/opencode serve --port "$PORT" --print-logs &
SERVER_PID=$!

echo "SERVER_PID=$SERVER_PID" >> "$GITHUB_ENV"
echo "PORT=$PORT" >> "$GITHUB_ENV"

echo "Waiting for opencode serve (PID: $SERVER_PID) on port $PORT..."

for i in $(seq 1 30); do
  HTTP_CODE=$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:$PORT" 2>/dev/null || true)
  if [ "$HTTP_CODE" = "200" ]; then
    echo "opencode serve is ready (attempt $i, HTTP $HTTP_CODE)"
    exit 0
  fi
  sleep 1
done

echo "ERROR: opencode serve did not become ready within 30 seconds"
exit 1
