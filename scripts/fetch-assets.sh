#!/usr/bin/env bash
# Скачивает изображения макета из Figma в папку public/ (macOS / Linux).
set -u
BASE="https://www.figma.com/api/mcp/asset"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
while read -r id path; do
  [ -z "$id" ] && continue
  mkdir -p "$ROOT/public/$(dirname "$path")"
  case "$id" in http*) url="$id";; *) url="$BASE/$id";; esac
  curl -sS -L --fail -o "$ROOT/public/$path" "$url" || echo "FAIL $path"
done < "$(dirname "$0")/assets.txt"
echo "Готово"
