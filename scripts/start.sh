#!/bin/bash

# Minecraft Server Manager - 起動スクリプト (macOS / Linux)

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

echo "Minecraft Server Manager を起動しています..."

# Docker が起動しているか確認
if ! docker info > /dev/null 2>&1; then
    echo "エラー: Docker が起動していません"
    echo "OrbStack または Docker Desktop を起動してください"
    exit 1
fi

# Tailscale IPを取得（利用可能な場合）
TAILSCALE_IP=""
if command -v tailscale &> /dev/null; then
    TAILSCALE_IP=$(tailscale ip -4 2>/dev/null || true)
fi

# イメージをビルドして起動
HOST_PROJECT_ROOT="$PROJECT_ROOT" TAILSCALE_IP="$TAILSCALE_IP" docker compose -f docker-compose.admin.yml up -d --build

echo ""
echo "起動しました!"
echo "ブラウザで http://localhost:3000 にアクセスしてください"
echo ""
echo "停止するには: ./scripts/stop.sh"
