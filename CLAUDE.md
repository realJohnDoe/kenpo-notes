# Instructions for Claude

- Use npm (kept to stay close to upstream Quartz).
- Before pushing, run the checks CI runs:
  - root: `npm ci && npm run install-plugins && npm test && npx quartz build`
  - `animations/`: `npm ci && npm run check && npm run build`

## Workshop

This repo is dispatched by the workshop. Before creating, labelling or
ordering an issue, or opening a PR, follow the `issue-conventions` skill. It
also covers when to open a PR and adding trace maps to it.
