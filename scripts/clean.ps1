# Minecraft Server Manager - 削除スクリプト (Windows)

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir
Set-Location $ProjectRoot

Write-Host "Minecraft Server Manager を削除しています..."

# コンテナを停止・削除
docker compose -f docker-compose.admin.yml down --rmi local --volumes 2>$null

Write-Host "削除しました"
Write-Host ""
Write-Host "再インストールするには: .\scripts\start.ps1"
