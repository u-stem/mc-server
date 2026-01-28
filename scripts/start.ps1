# Minecraft Server Manager - 起動スクリプト (Windows)

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir
Set-Location $ProjectRoot

Write-Host "Minecraft Server Manager を起動しています..."

# Docker が起動しているか確認
try {
    docker info | Out-Null
} catch {
    Write-Host "エラー: Docker が起動していません" -ForegroundColor Red
    Write-Host "Docker Desktop を起動してください"
    exit 1
}

# Tailscale IPを取得（利用可能な場合）
$TailscaleIP = ""
try {
    $TailscaleIP = (tailscale ip -4 2>$null)
} catch {
    # Tailscaleが利用不可の場合は空のまま
}

# イメージをビルドして起動
$env:HOST_PROJECT_ROOT = $ProjectRoot
$env:TAILSCALE_IP = $TailscaleIP
docker compose -f docker-compose.admin.yml up -d --build

Write-Host ""
Write-Host "起動しました!" -ForegroundColor Green
Write-Host "ブラウザで http://localhost:3000 にアクセスしてください"
Write-Host ""
Write-Host "停止するには: .\scripts\stop.ps1"
