# Instructions for Claude

- Use npm (Quartz and `animations/` both use it).
- Before pushing, run the checks CI runs:
  - root: `./quartz.sh` (builds the site with Quartz checked out at its pinned tag)
  - `animations/`: `npm ci && npm run check && npm run build`

## Workshop

This repo is dispatched by the workshop. Before creating, labelling or
ordering an issue, or opening a PR, follow the workshop plugin's
`conventions` skill. It also covers when to open a PR and adding trace maps
to it.
