# Contributing

How the repo is built and deployed. For what the notes are, see the
[README](README.md).

## Repository layout

| Path | What it is |
|---|---|
| `content/` | The Obsidian vault. Quartz turns it into the site. |
| `content/templates/` | Obsidian templates for new notes. Not published. |
| `content/private/` | Notes kept off the site. They are still visible in this repo on GitHub. |
| `animations/` | SvelteKit app that animates the forms. Deployed under `/animation/`. |
| `quartz.sh` | Checks out Quartz at a pinned tag and builds the site. |
| `quartz.config.yaml`, `quartz.ts` | Quartz configuration, copied into the checkout on every build. |
| `assets/` | Images for the README. Not published. |

`ignorePatterns` in `quartz.config.yaml` decides which folders stay off the site.

## Writing notes

Open `content/` as a vault in [Obsidian]. Notes link to each other with
`[[wikilinks]]`, and Quartz resolves them the same way Obsidian does. Start new
techniques from `content/templates/Technique.md`.

Pages that link to notes that don't exist yet are fine: the build lists them
and carries on.

## The site (Quartz)

Quartz isn't committed here. `quartz.sh` checks out [Quartz] at a pinned tag
into `.quartz-checkout/`, copies `quartz.config.yaml` and `quartz.ts` into it
and builds `content/` into `public/`. CI deploys the same build.

- **Build:** `./quartz.sh`. Needs git and Node 22.
- **Preview locally:** `./quartz.sh --serve`, then open http://localhost:8080.
  Changes to `content/` reload; changes to `quartz.config.yaml` or `quartz.ts`
  need a restart.
- **Upgrade Quartz:** bump `QUARTZ_TAG` in `quartz.sh` after reading the
  [Quartz releases](https://github.com/jackyzha0/quartz/releases). The next
  run checks out the new tag. Nothing proposes upgrades automatically.

## The animations

`animations/` is a SvelteKit app built as static pages. Each form is a YAML
file in `animations/static/forms/` (stances, directions, pivots and labels per
step) and becomes a page at `/kenpo-notes/animation/<file name>`. Form notes in
`content/3-forms/` link to their animation.

```sh
cd animations
npm ci
npm run dev      # local preview
npm test         # unit tests (Vitest, one run)
npm run test:watch  # unit tests in watch mode
npm run lint     # format check (Prettier)
npm run check    # type-check
npm run build    # static build into animations/build/
```

## Checks and deployment

CI (`.github/workflows/ci.yaml`) runs on pushes to `main` and on pull requests
into it:

- `./quartz.sh` builds the site.
- `npm ci && npm run check && npm run lint && npm test && npm run build` in
  `animations/`.

Run both before pushing. The `site` job copies the animations build into the
Quartz output, without replacing Quartz's home page. Pushes to `main` publish
that to the root of the `gh-pages` branch, which GitHub Pages serves. No other
branch deploys there; running the workflow by hand on `main` redeploys it.

**PR previews:** label a PR `preview` and CI publishes it to
`https://realjohndoe.github.io/kenpo-notes/pr-preview/pr-<number>/`, comments
the link on the PR and updates it on every push. The preview is removed when
the PR closes or loses the label. Previews are public, and PRs from forks
don't get one.

Builds read `BASE_PATH` for the path they're served under (default
`/kenpo-notes`). PR builds always use their preview path, so CI checks every
PR away from the usual base path, labelled or not. To build one locally:
`BASE_PATH=/kenpo-notes/pr-preview/pr-1 ./quartz.sh` (and the same variable
for `npm run build` in `animations/`). The form notes embed their animations
from the live site, so a preview shows `main`'s animations inside the notes;
open `pr-preview/pr-<number>/animation/<form>` to see the PR's.

Dependabot proposes dependency updates. A workflow labels non-major bumps
`automerge`, and the workshop dispatcher merges them once CI is green.

[Quartz]: https://github.com/jackyzha0/quartz
[Obsidian]: https://obsidian.md/
