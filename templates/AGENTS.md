# AGENTS.md

This file gives guidance to AI tools (Claude Code and friends) that work in this
repository. `CLAUDE.md` is a one-line pointer at this file, so both tools read
the same rules.

> Template from `rm3-shared/templates`. Copy it once, then add the sections thi.

## Development workflow

- **Always use `pnpm`, never `npm` or `yarn`.** The lockfile and the
  `packageManager` field assume pnpm.
