#!/usr/bin/env bash
# Quick helper to fetch the status-widget scripts into a target folder (default: scripts/)
set -euo pipefail

DEST_DIR="${1:-scripts}"
mkdir -p "$DEST_DIR"

BASE_URL="https://raw.githubusercontent.com/m760622/claude-status-widget/main/scripts"

echo "📥 Fetching status-widget scripts into '$DEST_DIR/'..."
curl -fsSL "$BASE_URL/status-widget.mjs" -o "$DEST_DIR/status-widget.mjs"
curl -fsSL "$BASE_URL/status-shot.mjs" -o "$DEST_DIR/status-shot.mjs"
chmod +x "$DEST_DIR/status-widget.mjs" "$DEST_DIR/status-shot.mjs" 2>/dev/null || true

echo "✅ Installed successfully in '$DEST_DIR/'"
