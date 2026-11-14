# Instructions for Claude

- If a task results in pushed commits and there is no open pull request for
  that branch yet, open one, even if not explicitly asked to.
- Use npm (kept to stay close to upstream Quartz). Dependabot proposes
  updates; non-major ones auto-merge once CI passes.
- Before pushing, run the checks CI runs:
  - root: `npm ci && npm run install-plugins && npm test && npx quartz build`
  - `animations/`: `npm ci && npm run check && npm run build`

## Workshop

This repo is dispatched by the workshop. Before creating or labelling an
issue, or opening a PR, follow the `issue-conventions` skill.
