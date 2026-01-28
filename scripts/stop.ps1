# Minecraft Server Manager - 停止スクリプト (Windows)

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir
Set-Location $ProjectRoot

Write-Host "Minecraft Server Manager を停止しています..."

docker compose -f docker-compose.admin.yml down

Write-Host "停止しました"
