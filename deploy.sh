#!/bin/bash
set -euo pipefail

# VPS デプロイスクリプト
# 使い方: ./deploy.sh [user@host] [branch]
#
# 前提条件:
#   - VPS に Docker と docker-compose-plugin がインストールされていること
#   - SSH 接続が設定されていること
#
# 例:
#   ./deploy.sh root@192.168.1.100
#   ./deploy.sh deploy@example.com main

VPS_HOST="${1:?Usage: ./deploy.sh [user@host] [branch]}"
BRANCH="${2:-main}"
APP_DIR="/opt/private-opencode-server"

echo "=== Deploying to VPS: ${VPS_HOST} ==="
echo "Branch: ${BRANCH}"

# リポジトリの更新
echo "--- Pulling latest code ---"
ssh "${VPS_HOST}" "mkdir -p ${APP_DIR}"
ssh "${VPS_HOST}" "cd ${APP_DIR} && git fetch origin && git checkout ${BRANCH} && git pull origin ${BRANCH}"

# 環境変数の確認
if ! ssh "${VPS_HOST}" "test -f ${APP_DIR}/.env"; then
  echo "WARNING: .env file not found on VPS. Creating from .env.example..."
  ssh "${VPS_HOST}" "cd ${APP_DIR} && cp .env.example .env"
  echo "Please edit ${APP_DIR}/.env on the VPS before first use."
fi

# Docker イメージのビルドと再起動
echo "--- Building Docker image ---"
ssh "${VPS_HOST}" "cd ${APP_DIR} && docker compose build"

echo "--- Restarting services ---"
ssh "${VPS_HOST}" "cd ${APP_DIR} && docker compose up -d"

echo "--- Cleaning up old images ---"
ssh "${VPS_HOST}" "docker image prune -f"

echo "=== Deployment complete ==="
echo "Check status: ssh ${VPS_HOST} 'cd ${APP_DIR} && docker compose ps'"
echo "View logs:    ssh ${VPS_HOST} 'cd ${APP_DIR} && docker compose logs -f'"
