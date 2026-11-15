#!/usr/bin/env bash
# Builds the site into public/ with Quartz checked out at a pinned tag.
# Extra arguments go to `quartz build`, e.g. `./quartz.sh --serve` for a local preview.
set -euo pipefail

# To upgrade Quartz, bump this tag (releases: https://github.com/jackyzha0/quartz/releases).
QUARTZ_TAG=v5.1.0

root=$(cd "$(dirname "$0")" && pwd)
dir="$root/.quartz-checkout"

if [ "$(git -C "$dir" describe --tags 2>/dev/null)" != "$QUARTZ_TAG" ]; then
  rm -rf "$dir" "$dir.tmp"
  git -c advice.detachedHead=false clone --quiet --depth 1 --branch "$QUARTZ_TAG" \
    https://github.com/jackyzha0/quartz.git "$dir.tmp"
  (cd "$dir.tmp" && npm ci)
  mv "$dir.tmp" "$dir"
fi

cp "$root/quartz.config.yaml" "$root/quartz.ts" "$dir/"
cd "$dir"
npm run install-plugins
npx quartz build -d "$root/content" -o "$root/public" "$@"
