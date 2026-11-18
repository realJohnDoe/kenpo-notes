#!/usr/bin/env bash
# Builds the site into public/ with Quartz checked out at a pinned tag.
# Extra arguments go to `quartz build`, e.g. `./quartz.sh --serve` for a local preview.
# BASE_PATH (e.g. /kenpo-notes/pr-preview/pr-12) replaces the path in baseUrl,
# for builds served somewhere other than /kenpo-notes.
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
if [ -n "${BASE_PATH:-}" ]; then
  sed -i -E "s#^(  baseUrl: [^/]+).*#\1${BASE_PATH}#" "$dir/quartz.config.yaml"
  grep -q "^  baseUrl: [^/]*${BASE_PATH}\$" "$dir/quartz.config.yaml" ||
    { echo "quartz.sh: could not set baseUrl to BASE_PATH" >&2; exit 1; }
fi
cd "$dir"
npm run install-plugins
npx quartz build -d "$root/content" -o "$root/public" "$@"
