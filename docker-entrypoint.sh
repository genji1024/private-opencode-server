#!/bin/sh
set -e

mkdir -p /home/nextjs/.local/share/opencode
mkdir -p /home/nextjs/.config/opencode

if [ -n "$OPENCODE_API_KEY" ]; then
  cat > /home/nextjs/.local/share/opencode/auth.json << EOF
{
  "opencode-go": {
    "type": "api",
    "key": "$OPENCODE_API_KEY"
  }
}
EOF
  chmod 600 /home/nextjs/.local/share/opencode/auth.json
fi

if [ -n "$GITHUB_PERSONAL_ACCESS_TOKEN" ] || [ -n "$STREAMABLE_HTTP_AUTH_TOKEN" ]; then
  {
    echo '{'
    echo '  "$schema": "https://opencode.ai/config.json",'
    echo '  "mcp": {'

    first_mcp=true
    if [ -n "$GITHUB_PERSONAL_ACCESS_TOKEN" ]; then
      $first_mcp || echo ','
      first_mcp=false
      cat << MCP_END
    "github": {
      "type": "remote",
      "url": "https://api.githubcopilot.com/mcp/",
      "headers": {
        "Authorization": "Bearer {env:GITHUB_PERSONAL_ACCESS_TOKEN}"
      },
      "oauth": false
    }
MCP_END
    fi

    if [ -n "$STREAMABLE_HTTP_AUTH_TOKEN" ]; then
      $first_mcp || echo ','
      first_mcp=false
      cat << MCP_END
    "gitlab": {
      "type": "remote",
      "url": "http://gitlab-mcp:3002/mcp",
      "headers": {
        "Authorization": "Bearer {env:STREAMABLE_HTTP_AUTH_TOKEN}"
      },
      "oauth": false
    }
MCP_END
    fi

    echo '  },'
    echo '  "permission": {'
    echo '    "*": "allow"'
    echo '  }'
    echo '}'
  } > /home/nextjs/.config/opencode/opencode.jsonc
fi

exec "$@"
