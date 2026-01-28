#!/bin/bash

# Minecraft Server Manager - 削除スクリプト (macOS / Linux)

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

echo "Minecraft Server Manager を削除しています..."

# コンテナを停止・削除
docker compose -f docker-compose.admin.yml down --rmi local --volumes 2>/dev/null || true

echo "削除しました"
echo ""
echo "再インストールするには: ./scripts/start.sh"
