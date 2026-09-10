# rm3-shared

Shared Claude plugin, tooling presets, and small libraries for rm3 projects.

One repo holds the Claude plugin (skills at the root), the lint / format /
tsconfig / hook presets, and two runtime libraries.

The repo lints, formats, typechecks and tests itself with its own presets, so a
preset that breaks a consumer breaks this repo first.

## Layout

```
rm3-shared/
├── .claude-plugin/plugin.json   Claude plugin manifest (name: rm3)
├── skills/                      Plugin skills, one directory per SKILL.md
├── packages/
│   ├── typescript-config/       tsconfig presets (node-app, node-lib, …)
│   ├── lint/                    anti-slop oxlint JS plugin rules
│   ├── oxlint-config/           shared oxlint config object (rm3Config)
│   ├── oxfmt-config/            shared oxfmt options (rm3Fmt)
│   ├── lefthook-config/         shared pre-commit jobs (lefthook.yml)
│   ├── env/                     type-safe env vars (zod)
│   └── logger/                  structured logging (pino)
├── templates/                   copy-once dotfiles for a new consumer repo
├── oxlint.config.ts             root dogfood: extends @rm3/oxlint-config
├── oxfmt.config.ts              root dogfood: spreads rm3Fmt
└── lefthook.yml                 root dogfood: extends @rm3/lefthook-config
```

## Use the Claude plugin

```sh
claude --plugin-dir ~/Workspaces/rm3-shared
```

## Use a skill from Codex

Codex reads skills from `~/.agents/skills`. Symlink the one you need so the
plugin stays the single source, for example when a Codex session is the
`rm3-orc` orchestrator:

```sh
ln -s ~/Workspaces/rm3-shared/skills/rm3-orc ~/.agents/skills/rm3-orc
```

## Templates

`templates/` holds files a new consumer repo copies **once** and then owns —
they are not linked, so later changes here do not propagate:

| file                    | note                                                                 |
| ----------------------- | -------------------------------------------------------------------- |
| `.gitattributes`        | LF normalization                                                     |
| `.gitignore`            | generic Node ignores                                                 |
| `.node-version`         | `v24`                                                                |
| `.vscode/settings.json` | oxc as the formatter, fix-on-save                                    |
| `AGENTS.md`             | workflow skeleton; add repo-specific sections below the generic ones |
| `CLAUDE.md`             | one line: `@AGENTS.md`                                               |

Copy them with a command that includes dotfiles, e.g.
`cp -R ~/Workspaces/rm3-shared/templates/. .`

`templates/.gitignore` is a nested ignore file; it hides none of its siblings.
No template needed renaming.

## Consume a preset (`link:`)

In the consumer's `package.json`:

```json
{
    "devDependencies": {
        "@rm3/typescript-config": "link:../rm3-shared/packages/typescript-config",
        "@rm3/oxlint-config": "link:../rm3-shared/packages/oxlint-config",
        "@rm3/oxfmt-config": "link:../rm3-shared/packages/oxfmt-config",
        "@rm3/lefthook-config": "link:../rm3-shared/packages/lefthook-config"
    }
}
```

1. **Run `pnpm install` in rm3-shared first.** A `link:` dep is a symlink into
   this checkout, not a copy, so a linked package resolves its own runtime
   dependencies from _this_ repo's `node_modules`. Without an install here,
   those imports dangle. Which packages care:

    | package                  | ships            | needs an install here                                                                                       |
    | ------------------------ | ---------------- | ----------------------------------------------------------------------------------------------------------- |
    | `@rm3/typescript-config` | JSON presets     | no                                                                                                          |
    | `@rm3/lefthook-config`   | `lefthook.yml`   | no                                                                                                          |
    | `@rm3/oxfmt-config`      | `./src/index.ts` | no — its only `oxfmt` import is `import type`, erased at runtime                                            |
    | `@rm3/oxlint-config`     | `./src/index.ts` | **yes** — it imports `@rm3/lint`, `eslint-plugin-perfectionist` and `oxlint-plugin-react-doctor` at runtime |
    | `@rm3/env`               | `./src/index.ts` | **yes** — imports `zod`                                                                                     |
    | `@rm3/logger`            | `./src/index.ts` | **yes** — imports `pino` and `pino-pretty`                                                                  |

    Install unconditionally anyway: the tree is one `pnpm install` and the two
    config presets are usually linked next to `@rm3/oxlint-config`.

2. **The directory must be named `rm3-shared`.** The `link:` paths above are
   relative (`../rm3-shared`), so every consumer breaks if the checkout sits
   under another name.
3. **Check out the sibling in CI**, or switch those deps to git URLs. A `link:`
   path has no registry fallback.

React and react-doctor are on by default in `rm3Config`.

Then in the consumer:

```ts
// oxlint.config.ts
import { rm3Config } from '@rm3/oxlint-config';
import { defineConfig } from 'oxlint';

export default defineConfig({ extends: [rm3Config], env: { node: true } });
```

```ts
// oxfmt.config.ts — oxfmt has no `extends`, so spread instead
import { rm3Fmt } from '@rm3/oxfmt-config';
import { defineConfig } from 'oxfmt';

export default defineConfig({
    ...rm3Fmt,
    ignorePatterns: [...rm3Fmt.ignorePatterns, 'generated'],
});
```

```yaml
# lefthook.yml
extends:
    - node_modules/@rm3/lefthook-config/lefthook.yml
```

TypeScript packages extend `@rm3/typescript-config/node-app.json` (also the
default export, so bare `@rm3/typescript-config` works).

## Bump procedure

`oxlint` and `@oxlint/plugins` are pinned exact because the JS plugin API is
alpha: a consumer running a different oxlint than the one that built the plugin
objects fails at config load, not at lint time.

1. Bump `oxlint` and `@oxlint/plugins` here, to the same version, in every
   `package.json` that names them.
2. `pnpm install && pnpm check` here.
3. Bump the same two to the same version in machdown and openmint, and run
   their checks.

Do all three repos in one sitting. A half-finished bump leaves consumers unable
to load the shared config.

## Pitfalls

- **`extends` concatenates.** oxlint's `extends` merges `jsPlugins` and
  `overrides` by concatenation, and last wins for scalar fields — verified in
  unit 06 against oxlint 1.80.0. So a consumer only ever _adds_ to the preset.
  There is **no** `withRm3()` spread helper; the fallback was never needed.
  Note that `oxlint --print-config` does not serialize `jsPlugins`; to check
  whether a plugin is active, lint a fixture file that should trip it.
- **lefthook `extends` wins over the local file.** A local job with the same
  name as a shared one is overridden, not merged. Never reuse the shared names
  `oxfmt`, `oxlint`, `no-focused-tests`. To skip a shared job in one repo, use a
  gitignored `lefthook-local.yml`.
- **Two copies of `zod`.** rm3-shared and the consumer each resolve their own.
  Structurally different zod versions split the types at the `createEnv`
  boundary, so keep the ranges identical.
- **`import.meta.resolve` must execute inside rm3-shared.** The oxlint config
  resolves plugin paths relative to this repo. Do not rebuild `jsPlugins` in a
  consumer wrapper — import `rm3Config` and extend it.
- **The pre-commit hook is stricter than `pnpm lint`.** It runs
  `oxlint --fix --max-warnings 0`, so a warning that `pnpm lint` tolerates
  blocks the commit.

## License

MIT — see [LICENSE](LICENSE).
