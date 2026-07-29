#!/bin/sh
set -e

# Create necessary directories for opencode
mkdir -p /home/nextjs/.local/share/opencode
mkdir -p /home/nextjs/.config/opencode

# Generate auth.json from environment variable if provided
if [ -n "$OPENCODE_API_KEY" ]; then
  cat > /home/nextjs/.local/share/opencode/auth.json << EOF
{
  "opencode-go": {
    "type": "api",
    "key": "$OPENCODE_API_KEY"
  }
}
EOF
  chown nextjs:nodejs /home/nextjs/.local/share/opencode/auth.json
  chmod 600 /home/nextjs/.local/share/opencode/auth.json
fi

# Generate opencode.jsonc from environment variables if provided
if [ -n "$GITHUB_PERSONAL_ACCESS_TOKEN" ] || [ -n "$STREAMABLE_HTTP_AUTH_TOKEN" ]; then
  cat > /home/nextjs/.config/opencode/opencode.jsonc << 'EOF'
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
EOF

  if [ -n "$GITHUB_PERSONAL_ACCESS_TOKEN" ]; then
    cat >> /home/nextjs/.config/opencode/opencode.jsonc << 'EOF'
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
      echo "    ," >> /home/nextjs/.config/opencode/opencode.jsonc
    fi
    cat >> /home/nextjs/.config/opencode/opencode.jsonc << 'EOF'
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

  cat >> /home/nextjs/.config/opencode/opencode.jsonc << 'EOF'
  },
  "permission": {
    "*": "allow"
  }
}
EOF
  chown nextjs:nodejs /home/nextjs/.config/opencode/opencode.jsonc
fi

# Execute the main command
exec "$@"
