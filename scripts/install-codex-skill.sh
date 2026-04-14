#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SOURCE="$REPO_ROOT/codex-skill/elite-engineer"
DESTINATION="${1:-$HOME/.codex/skills}"
TARGET="$DESTINATION/elite-engineer"

if [[ ! -d "$SOURCE" ]]; then
  echo "Codex skill source folder not found at $SOURCE" >&2
  exit 1
fi

mkdir -p "$DESTINATION"
rm -rf "$TARGET"
cp -R "$SOURCE" "$TARGET"

echo "Installed elite-engineer skill to $TARGET"
echo "Restart Codex to pick up the new skill."
