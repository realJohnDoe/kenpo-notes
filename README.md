# Johannes' Kenpo Notes

You can find my notes deployed [here][docs].
Kudos go to [Quartz] and [Obsidian].

[docs]: https://realjohndoe.github.io/kenpo-notes/
[Quartz]: https://github.com/jackyzha0/quartz
[Obsidian]: https://obsidian.md/

## Building

Quartz isn't committed here. `quartz.sh` checks out [Quartz] at a pinned tag
into `.quartz-checkout/`, copies `quartz.config.yaml` and `quartz.ts` into it
and builds `content/` into `public/`. CI deploys the same build.

- **Preview locally:** `./quartz.sh --serve`, then open http://localhost:8080.
  Needs git and Node 22. Changes to `content/` reload; changes to
  `quartz.config.yaml` or `quartz.ts` need a restart.
- **Upgrade Quartz:** bump `QUARTZ_TAG` in `quartz.sh` after reading the
  [Quartz releases](https://github.com/jackyzha0/quartz/releases). The next
  run checks out the new tag. Nothing proposes upgrades automatically.
