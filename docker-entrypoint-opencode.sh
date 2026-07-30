#!/bin/sh
set -e

mkdir -p "$HOME/.local/share/opencode" "$HOME/.config/opencode"

if [ -n "$OPENCODE_API_KEY" ]; then
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

if [ -n "$GITHUB_PERSONAL_ACCESS_TOKEN" ] || [ -n "$STREAMABLE_HTTP_AUTH_TOKEN" ]; then
  cat > "$HOME/.config/opencode/opencode.jsonc" << 'EOF'
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
EOF

  if [ -n "$GITHUB_PERSONAL_ACCESS_TOKEN" ]; then
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

  if [ -n "$STREAMABLE_HTTP_AUTH_TOKEN" ]; then
    if [ -n "$GITHUB_PERSONAL_ACCESS_TOKEN" ]; then
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

exec "$@"
