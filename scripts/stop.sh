#!/bin/bash

# Minecraft Server Manager - 停止スクリプト (macOS / Linux)

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

echo "Minecraft Server Manager を停止しています..."

docker compose -f docker-compose.admin.yml down

echo "停止しました"
