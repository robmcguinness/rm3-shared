# @rm3/oxlint-config

The shared strict oxlint configuration for rm3 repos. It is a plain config **object**, not a
`defineConfig` call: calling `defineConfig` here would bind rm3-shared's copy of oxlint inside the
consumer. The consumer calls `defineConfig` with its own oxlint.

## Peer tools

`oxlint@1.80.0` (exact — JS plugins are alpha and must match across repos), `oxlint-tsgolint`,
`typescript`.

## Exports

| export                            | what it is                                                                                                                                                    |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rm3Config` (also `default`)      | the config object: `env`, `jsPlugins`, `options`, `categories`, `plugins`, `rules`, and three generic `overrides` (`**/*.tsx`, `*.config.ts`, `**/*.test.ts`) |
| `antiSlopRules`                   | the 15 anti-slop rules at `error`, re-exported from `@rm3/lint`                                                                                               |
| `antiSlopRulesOff`                | the same keys at `off`, for generated or AST-walking code                                                                                                     |
| `complexityRules`                 | `complexity`, `max-depth`, `max-nested-callbacks`, `max-params`                                                                                               |
| `reactPlugins`                    | already in `rm3Config`; exported for overrides that set their own `plugins`                                                                                   |
| `reactRules`                      | already in `rm3Config`; exported for overrides that set their own `plugins`                                                                                   |
| `reactRulesOn`                    | React rules from the off `style`, `restriction` and `nursery` categories, opted in by name                                                                    |
| `reactRulesOff`                   | React rules turned off on purpose, each with a reason; still exported for older consumers                                                                     |
| `reactDoctorJsPlugin`             | already in `rm3Config`; exported for overrides that set their own `plugins`                                                                                   |
| `reactDoctorRules`                | already in `rm3Config`; exported for overrides that set their own `plugins`                                                                                   |
| `reactDoctorOxlintCounterparts`   | independent React Doctor duplicates mapped to the oxlint rules that own them                                                                                  |
| `reactDoctorRulesCoveredByOxlint` | those duplicate rule keys at `off`, enforced by tests                                                                                                         |
| `reactDoctorRulesOff`             | recommended react-doctor rules rm3 turns off, each restating a decision `rm3Config` already made                                                              |
| `reactDoctorFrameworkRules`       | react-doctor's per-framework rules, keyed `nextjs`, `preact`, `react-native`, `tanstack-query`, `tanstack-start`                                              |
| `reactDoctorCapabilityRules`      | react-doctor rules gated on the environment, keyed `ssr`, `react-compiler`, `i18n` — spread after `reactDoctorRules`                                          |
| `shadcnRulesOff`                  | `antiSlopRulesOff` plus the style rules vendored shadcn primitives trip                                                                                       |

React and react-doctor are on by default in `rm3Config`. An explicit plugin list REPLACES
the base list, so overrides that set `plugins` must include `reactPlugins` to retain React.

`rm3Config.env` is `builtin` + `es2024` only. Add `node`, `browser` or `serviceworker` yourself:
the right answer differs per repo and per directory.

## How a consumer extends it

```ts
// oxlint.config.ts
import { defineConfig } from 'oxlint';
import rm3Config, {
    reactDoctorCapabilityRules,
    reactDoctorFrameworkRules,
    shadcnRulesOff,
} from '@rm3/oxlint-config';

export default defineConfig({
    extends: [rm3Config],
    env: { node: true },
    overrides: [
        {
            files: ['src/**/*.tsx'],
            rules: {
                // Only what the repo is; oxlint cannot read package.json for it.
                ...reactDoctorFrameworkRules['tanstack-query'],
                ...reactDoctorCapabilityRules.ssr,
            },
        },
        {
            files: ['src/components/ui/**'],
            rules: { ...shadcnRulesOff },
        },
    ],
});
```

## react-doctor runs inside oxlint

[react-doctor](https://www.react.doctor) ships its rules as an oxlint JS plugin,
`oxlint-plugin-react-doctor`, so `pnpm lint` is the whole check: no second CLI, no second
config file, no second hook. This package pins the plugin, resolves it from rm3-shared, and
turns its rule registry into the exports above:

- `reactDoctorRules` is react-doctor's own recommended set at react-doctor's own severities.
  It leaves out what cannot run or should not run under standalone oxlint: whole-project
  rules and security scans (they need the CLI's tree walk and are no-ops in oxlint), rules
  react-doctor itself ships disabled, and the 100 rules react-doctor ported from oxlint's
  `react`, `react-perf` and `jsx-a11y` plugins. The Rust originals run under `reactPlugins`;
  running both would report every finding twice.
- `reactDoctorRulesOff` is spread last into `reactDoctorRules`. Each entry restates a decision
  `rm3Config` already made for the matching oxlint rule (`no-multi-comp`, `complexity` in
  `.tsx`, `max-lines-per-function`), so the two tools cannot disagree.
- `reactDoctorFrameworkRules` holds the framework buckets. The CLI switches them on by
  reading `package.json`; oxlint cannot, so a consumer spreads the buckets it needs.
- `reactDoctorCapabilityRules` holds the rules the CLI gates on the environment rather than
  on an import. A `zustand` rule only matches zustand code, so it can stay in the base set;
  `react-compiler-no-manual-memoization` flags every `useMemo`, so it cannot. `ssr` adds the
  hydration and browser-global rules, `react-compiler` adds the compiler rule and turns the
  manual-memoization advice off, `i18n` adds the IME composition guard. The base set assumes
  React 19: rules that need an older React are left out.

Rules tagged `test-noise` skip `*.test.*`, `*.spec.*` and `__tests__/` files on their own.

"oxlint owns a ported rule" has to mean oxlint runs it, or the rule is silent in both tools.
`rm3Config` turns the `style`, `restriction` and `nursery` categories off, so `reactRules` names
every ported rule from those categories by hand: on where it catches a bug or is a cheap autofix,
off with a reason where it is a ban list or measures markup.

`src/index.test.ts` checks both halves against the pinned tools. It recomputes the
recommended-minus-ported split from `oxlint --rules --format=json` and the plugin's
`RECOMMENDED_RULES`, then checks that every rule in that split is in `reactDoctorRules`, in a
capability bucket, or off because it needs an older React. A bump on either side that adds,
drops or re-levels a rule fails here rather than in a consumer. It then checks that each ported
rule react-doctor recommends is in a category `rm3Config` turns on or is named in `reactRules`.

## Dedup policy

- Ported `originallyExternal` rules stay off; the Rust originals run.
- `reactDoctorRulesCoveredByOxlint` turns off independent re-implementations. Tests enforce
  that every named counterpart exists and remains enabled.
- `reactDoctorRulesOff` records rules that would undo an rm3 decision, including the deliberate
  `no-await-in-loop` exception for sequential filesystem and git work.
- Partial overlaps stay on: `js-set-map-lookups` catches lookup-in-loop shapes beyond
  `unicorn/prefer-set-has`; `no-mutating-array-method-on-prop-or-hook-result` covers mutations
  beyond `unicorn/no-array-sort`, including `reverse` and `splice`.

## jsPlugins resolve from here, not from you

`rm3Config.jsPlugins` and `reactDoctorJsPlugin` build their specifiers with `import.meta.resolve`,
evaluated inside this package. The paths therefore point into rm3-shared's own `node_modules`,
which is what makes the config work through a `link:` symlink — a consumer does not need
`eslint-plugin-perfectionist`, `oxlint-plugin-react-doctor` or `@rm3/lint` installed.
