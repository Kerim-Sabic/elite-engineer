param(
  [string]$Destination = ""
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$source = Join-Path $repoRoot "codex-skill\elite-engineer"

if (-not (Test-Path $source)) {
  throw "Codex skill source folder not found at $source"
}

if ([string]::IsNullOrWhiteSpace($Destination)) {
  $Destination = Join-Path $HOME ".codex\skills"
}

$target = Join-Path $Destination "elite-engineer"

New-Item -ItemType Directory -Force $Destination | Out-Null

if (Test-Path $target) {
  Remove-Item -Recurse -Force $target
}

Copy-Item -Recurse -Force $source $target

Write-Output "Installed elite-engineer skill to $target"
Write-Output "Restart Codex to pick up the new skill."
