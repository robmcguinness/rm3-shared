# @rm3/oxlint-config

The shared strict oxlint configuration for rm3 repos. It is a plain config **object**, not a
`defineConfig` call: calling `defineConfig` here would bind rm3-shared's copy of oxlint inside the
consumer. The consumer calls `defineConfig` with its own oxlint.

## Peer tools

`oxlint@1.80.0` (exact — JS plugins are alpha and must match across repos), `oxlint-tsgolint`,
`typescript`.

## Exports

| export                       | what it is                                                                                                                                                    |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rm3Config` (also `default`) | the config object: `env`, `jsPlugins`, `options`, `categories`, `plugins`, `rules`, and three generic `overrides` (`**/*.tsx`, `*.config.ts`, `**/*.test.ts`) |
| `antiSlopRules`              | the 15 anti-slop rules at `error`, re-exported from `@rm3/lint`                                                                                               |
| `antiSlopRulesOff`           | the same keys at `off`, for generated or AST-walking code                                                                                                     |
| `complexityRules`            | `complexity`, `max-depth`, `max-nested-callbacks`, `max-params`                                                                                               |
| `reactPlugins`               | `['react', 'react-perf', 'jsx-a11y']` — add them in a React override                                                                                          |
| `reactRulesOff`              | rules to disable over React source                                                                                                                            |
| `shadcnRulesOff`             | `antiSlopRulesOff` plus the style rules vendored shadcn primitives trip                                                                                       |

`rm3Config.plugins` names universal plugins only. An explicit plugin list REPLACES oxlint's
defaults, so a React repo adds `reactPlugins` in an override rather than at the top level.

`rm3Config.env` is `builtin` + `es2024` only. Add `node`, `browser` or `serviceworker` yourself:
the right answer differs per repo and per directory.

## How a consumer extends it

```ts
// oxlint.config.ts
import { defineConfig } from 'oxlint';
import rm3Config, { reactPlugins, reactRulesOff, shadcnRulesOff } from '@rm3/oxlint-config';

export default defineConfig({
    extends: [rm3Config],
    env: { node: true },
    overrides: [
        {
            files: ['src/**/*.tsx'],
            plugins: [...reactPlugins],
            rules: { ...reactRulesOff },
        },
        {
            files: ['src/components/ui/**'],
            plugins: [...reactPlugins],
            rules: { ...shadcnRulesOff },
        },
    ],
});
```

## jsPlugins resolve from here, not from you

`rm3Config.jsPlugins` builds its specifiers with `import.meta.resolve`, evaluated inside this
package. The paths therefore point into rm3-shared's own `node_modules`, which is what makes the
config work through a `link:` symlink — a consumer does not need `eslint-plugin-perfectionist` or
`@rm3/lint` installed.
