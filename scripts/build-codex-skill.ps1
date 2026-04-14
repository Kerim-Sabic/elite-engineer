param(
  [string]$OutputDir = "dist"
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$skillRoot = Join-Path $repoRoot "codex-skill\elite-engineer"
$outputRoot = Join-Path $repoRoot $OutputDir
$stagingRoot = Join-Path $outputRoot "elite-engineer"
$zipPath = Join-Path $outputRoot "elite-engineer-codex-skill.zip"

if (-not (Test-Path $skillRoot)) {
  throw "Codex skill folder not found at $skillRoot"
}

New-Item -ItemType Directory -Force $outputRoot | Out-Null

if (Test-Path $stagingRoot) {
  Remove-Item -Recurse -Force $stagingRoot
}

if (Test-Path $zipPath) {
  Remove-Item -Force $zipPath
}

Copy-Item -Recurse -Force $skillRoot $stagingRoot
Compress-Archive -Path $stagingRoot -DestinationPath $zipPath -Force

Write-Output "Built Codex skill zip at $zipPath"
