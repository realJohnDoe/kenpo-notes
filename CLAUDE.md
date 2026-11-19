# Instructions for Claude

- Use npm (Quartz and `animations/` both use it).
- Before pushing, run the checks CI runs:
  - root, when `content/`, `quartz.*` or `.github/workflows/` changed: `./quartz.sh`
  - `animations/`, when `animations/` or `.github/workflows/` changed: `npm ci && npm run check && npm run lint && npm test && npm run build`
  - the browser check of the built site under its base path (CI's `e2e` job), when `content/`, `quartz.*`, `animations/` or `.github/workflows/` changed: after both builds, combine them as the `site` job does (`cp -r animations/build/. public/`), then `cd animations && npx playwright-core install chromium && SITE_DIR=../public npm run test:e2e` (set `CHROME=/usr/bin/google-chrome` to use an installed Chrome; `BASE_PATH` must match the build's)

## Workshop

This repo is dispatched by the workshop. Before creating, labelling or
ordering an issue, or opening a PR, follow the workshop plugin's
`conventions` skill. It also covers when to open a PR and adding trace maps
to it.
