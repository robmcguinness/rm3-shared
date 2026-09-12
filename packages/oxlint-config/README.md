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
| `nodeRules`                       | already in `rm3Config`; `nodeRulesOn` plus `nodeRulesOff`, exported for overrides that set their own `plugins`                                                |
| `nodeRulesOn`                     | Node rules from the off `style`, `restriction` and `nursery` categories plus the five `rm3-node` plugin rules, opted in by name                               |
| `nodeRulesOff`                    | Node rules turned off on purpose, each with a reason                                                                                                          |
| `nodeTestRulesOff`                | the Node rules the `**/*.test.ts` override relaxes; spread into your own override when tests live under another glob                                          |
| `restrictedImportPaths`           | the `no-restricted-imports` list (packages a Node built-in replaces); extend it in an override rather than restating it                                       |
| `rm3NodeJsPlugin`                 | already in `rm3Config`; the `rm3-node` jsPlugin entry, exported for overrides that set their own `plugins`                                                    |
| `nodeCustomRules`                 | the five `rm3-node` plugin rules at `error`, re-exported from `@rm3/lint/node`                                                                                |
| `tailwindRulesOn`                 | already in `rm3Config`; the two `rm3-tailwind` plugin rules                                                                                                   |
| `rm3TailwindJsPlugin`             | already in `rm3Config`; the `rm3-tailwind` jsPlugin entry, exported for overrides that set their own `plugins`                                                |
| `tailwindCustomRules`             | the two `rm3-tailwind` plugin rules at `error`, re-exported from `@rm3/lint/tailwind`                                                                         |
| `fastifyRulesOn`                  | already in `rm3Config`; the five `rm3-fastify` plugin rules                                                                                                   |
| `rm3FastifyJsPlugin`              | already in `rm3Config`; the `rm3-fastify` jsPlugin entry, exported for overrides that set their own `plugins`                                                 |
| `fastifyCustomRules`              | the five `rm3-fastify` plugin rules at `error`, re-exported from `@rm3/lint/fastify`                                                                          |

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

## Node rules

`nodeRules` turns the practices in the global `node` skill and `skills/rm3-nodejs` into
ratchets. `rm3Config` turns the `style`, `restriction` and `nursery` categories off, so each
rule is named by hand in `nodeRulesOn` with the skill file it comes from. The ones that change
what already-passing code has to look like:

- `typescript/no-floating-promises` runs with `ignoreVoid: false`. `void promise` is no
  longer an escape hatch; a fire-and-forget call ends in `.catch` or is awaited, because an
  unhandled rejection reaches close-with-grace and takes the process down.
- `import/extensions` requires the `.ts` extension on relative imports everywhere, including
  Vite apps (the `react-vite.json` preset accepts it).
- `no-restricted-imports` bans packages a Node built-in replaces (`dotenv`, `axios`, `uuid`,
  `vitest`, `winston`, ...), plain `node:assert` in favour of `node:assert/strict`, and
  `it` from `node:test` in favour of `test`. Inside `*.test.ts` it also bans `setTimeout`
  from `node:timers/promises`: a fixed sleep is a flaky test.
- `node/no-sync` (allowed at module level, off in tests), `unicorn/no-process-exit` and
  `promise/prefer-await-to-then` each expect a named per-line disable at the handful of sites
  where the pattern is the point: a CLI entrypoint, a promise-chain mutex.
- Five rules from the `rm3-node` plugin in `@rm3/lint`: `prefer-timers-promises`,
  `no-unguarded-json-parse`, `no-manual-signal-handlers`, and two pino log-shape rules from the
  `fastify-best-practices` skill's logging.md, `prefer-err-log-key` (an Error goes under `err`,
  the only key pino serializes) and `no-log-string-interpolation` (a constant message, values as
  fields). See `packages/lint/README.md`.

`nodeRulesOff` records the deliberate exceptions: `node/no-top-level-await` (unicorn's
`prefer-top-level-await` is on), `promise/avoid-new`, `typescript/promise-function-async`,
`import/no-default-export`, and the CommonJS-only `node/*` rules that
`unicorn/prefer-module` makes unreachable.

A consumer with tests under a glob other than `**/*.test.ts`:

```ts
overrides: [
    { files: ['tests/**/*.ts', '**/*.test.tsx'], rules: { ...nodeTestRulesOff } },
],
```

To restrict one more package, extend the list instead of restating it, since an override
replaces the rule's options:

```ts
rules: {
    'no-restricted-imports': [
        'error',
        { paths: [...restrictedImportPaths, { name: 'moment', message: 'Use Temporal.' }] },
    ],
},
```

## Tailwind rules

`tailwindRulesOn` turns the two checkable practices in `skills/rm3-tailwind` into ratchets, both
from the `rm3-tailwind` plugin in `@rm3/lint` (see `packages/lint/README.md`):

- `rm3-tailwind/no-arbitrary-values`: no `bg-[#fff]` / `p-[13px]` outside `h-`, `w-`, `min-h-`,
  `max-h-`, `min-w-`, `max-w-`. Tokens live in `@theme`. Arbitrary variants such as
  `data-[state=open]:` are not values and pass.
- `rm3-tailwind/no-dynamic-class-names`: no `bg-${color}-600` or `'text-' + size`; Tailwind only
  emits classes it finds whole in source.

Both are on for every file and match only `className` / `class` attributes and the class helpers
(`cn`, `clsx`, `cva`, `twMerge`, `tv`, `twJoin`), so a Node file pays nothing. `shadcnRulesOff`
turns both off: upstream primitives use `rounded-[...]` and `transition-[...]`.

A consumer that needs structural arbitrary values widens the allowlist in its own override; the
override replaces the rule's options, so restate the defaults:

```ts
rules: {
    'rm3-tailwind/no-arbitrary-values': [
        'error',
        { allow: ['h-', 'w-', 'min-h-', 'max-h-', 'min-w-', 'max-w-', 'grid-cols-', 'transition-'] },
    ],
},
```

The skill's other practices are not lint rules: `@apply` lives in CSS, which oxlint does not
read, and class sorting belongs to `oxfmt` (`sortTailwindcss`), not the linter.

## Fastify rules

`fastifyRulesOn` turns the five practices in the `fastify-best-practices` and
`logging-best-practices` skills that a linter can decide from the call shape into ratchets, all
from the `rm3-fastify` plugin in `@rm3/lint` (see `packages/lint/README.md`):

- `rm3-fastify/return-reply`: `return reply.send(...)` (or `await` it) inside an async handler
  or hook. A bare send leaves the hook chain and handler running after the response is out.
- `rm3-fastify/no-callback-hooks`: hooks are `async (request, reply) => {}`; the `done` form is
  the legacy signature, and an async hook that also takes `done` runs the chain twice.
- `rm3-fastify/no-default-request-logging`: when a logger is configured, provide a
  `logController` (such as `new LogController({ disableRequestLogging: true })`) or set
  `disableRequestLogging` to anything other than literal `false`, then emit the one wide event
  from `onResponse` instead of Fastify's two default request lines.
- `rm3-fastify/require-gen-req-id`: configure `genReqId` so request ids remain unique across
  process restarts and instances instead of using Fastify's per-process counter. An options
  identifier, a call, or an object literal with a spread is opaque and passes both factory rules.
- `rm3-fastify/require-plugin-name`: every `fp(plugin, { name })`. Fastify resolves
  `dependencies` by name and refuses a named plugin twice; an unnamed one gets neither.

All five are on for every file and key on `addHook`, the `fastify` or `fastify-plugin` import
and the handler signature, so a file without Fastify pays nothing. Three limits worth knowing:
a function is a handler when it is passed to
`get`/`post`/.../`route`/`addHook`/`setErrorHandler`, sits under a handler key in route options,
or has a `FastifyRequest`/`FastifyReply` parameter type, so an Express
`router.get(url, async (req, res) => { res.send() })` matches too; a hook passed by reference
(`addHook('onRequest', securityHook)`) is not inspected; and the factory rules do not match a
namespace import such as `import * as f from 'fastify'; f.fastify()`.

Not lint rules, on purpose: a schema on every route (every route in the consumer repos is an
oRPC catch-all or a document route, so it would only report false positives), `fastify-plugin`
around every decorator (whether a decorator must escape encapsulation is intent), and a
reference-typed `decorateRequest` default (Fastify throws `FST_ERR_DEC_REFERENCE_TYPE` at boot).

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
