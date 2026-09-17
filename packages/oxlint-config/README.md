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
| `shadcnRulesOff`                  | `antiSlopRulesOff`, the style rules vendored shadcn primitives trip, every `rm3-shadcn` rule, and the three `shadcn/*` rules `@shadcn/lint` turns off there   |
| `nodeRules`                       | already in `rm3Config`; `nodeRulesOn` plus `nodeRulesOff`, exported for overrides that set their own `plugins`                                                |
| `nodeRulesOn`                     | Node rules from the off `style`, `restriction` and `nursery` categories plus the seven `rm3-node` plugin rules, opted in by name                              |
| `nodeRulesOff`                    | Node rules turned off on purpose, each with a reason                                                                                                          |
| `nodeTestRulesOff`                | the Node rules the `**/*.test.ts` override relaxes; spread into your own override when tests live under another glob                                          |
| `restrictedImportPaths`           | the `no-restricted-imports` list (packages a Node built-in replaces); extend it in an override rather than restating it                                       |
| `rm3NodeJsPlugin`                 | already in `rm3Config`; the `rm3-node` jsPlugin entry, exported for overrides that set their own `plugins`                                                    |
| `nodeCustomRules`                 | the seven `rm3-node` plugin rules at `error`, re-exported from `@rm3/lint/node`                                                                               |
| `shadcnLintRulesOn`               | already in `rm3Config`; the six `@shadcn/lint` rules with their options                                                                                       |
| `shadcnLintJsPlugin`              | already in `rm3Config`; the `@shadcn/lint` jsPlugin entry (`shadcn/*`), exported for overrides that set their own `plugins`                                   |
| `shadcnRulesOn`                   | already in `rm3Config`; the twenty `rm3-shadcn` plugin rules                                                                                                  |
| `rm3ShadcnJsPlugin`               | already in `rm3Config`; the `rm3-shadcn` jsPlugin entry, exported for overrides that set their own `plugins`                                                  |
| `shadcnCustomRules`               | the twenty `rm3-shadcn` plugin rules at `error`, re-exported from `@rm3/lint/shadcn`                                                                          |
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
- Seven rules from the `rm3-node` plugin in `@rm3/lint`: `prefer-timers-promises`,
  `no-unguarded-json-parse`, `no-manual-signal-handlers`, and two pino log-shape rules from the
  `fastify-best-practices` skill's logging.md, `prefer-err-log-key` (an Error goes under `err`,
  the only key pino serializes) and `no-log-string-interpolation` (a constant message, values as
  fields), plus two rules from `logging-best-practices`: `no-log-in-loop` (one event after the
  loop with counts and failed items) and `no-json-stringify-log` (pass the object as fields so it
  stays queryable). See `packages/lint/README.md`.

The logging skill's two-level-only policy is not a lint rule because it conflicts with the
`node` and `fastify-best-practices` skills. Neither are its single-logger policy (only eval
scripts and a deliberate fallback use a second one) or environment context in the logger base;
a required `service` option on `@rm3/logger` is the stronger fix for the latter.

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

## @shadcn/lint rules

`shadcnLintRulesOn` turns on the six rules of [`@shadcn/lint`](https://github.com/shadcn-ui/lint),
a project-aware linter for Tailwind design systems. The plugin reads the nearest `components.json`
(the `ui` alias, the theme CSS and its `@theme` colors), the `cva` / `tv` variants and typed props of
each component, and the installed Tailwind v4, and its messages name the token, scale value or
variant to use instead. All six are at `error`:

- `shadcn/no-restyle` (`allow: ['layout']`): a non-layout class on a design-system component
  (`<Button className="p-4 bg-pink-500">`). Margin, width, position and display pass; padding,
  color, typography, shape, effects and motion report, and the message lists the component's
  variants and sizes. Only components resolved from the `ui` directory (through re-exports and
  `className`-forwarding wrappers) are checked; a plain `div` is not in scope.
- `shadcn/no-raw-colors`: `bg-blue-500`, `text-gray-600`, a token the theme does not declare
  (`bg-highlight`), and a literal SVG `fill` / `stroke`. The message lists the declared tokens
  and the nearest one by color.
- `shadcn/no-arbitrary-values` (`allow: ['layout']`): `p-[13px]`, `rounded-[10px]`, `bg-[#333]`;
  the message names the on-scale replacement (`p-3.25`). `w-[320px]` passes under `layout`.
  Arbitrary variants (`data-[state=open]:`) and the variable shorthand (`bg-(--brand)`) are not
  values.
- `shadcn/no-inline-styles`: `style={{ color: ... }}` and `<style>`. A dynamic value goes through
  a CSS custom property (`style={{ '--w': width }}` with `w-(--w)`).
- `shadcn/no-unknown-classes`: a class the project's Tailwind cannot generate (`flex-cols`,
  `hovr:flex`), with a spelling suggestion. Runs the installed Tailwind in a worker thread; if it
  or the theme cannot load, the rule warns once on stderr and falls back to a grammar that checks
  less. Classes from a stylesheet outside the theme's import graph need an `allow` entry.
- `shadcn/require-static-classes`: a class value on a design-system component the linter cannot
  read (`` `bg-${color}` ``, an imported constant, an unknown call).

`shadcnRulesOff` turns `no-restyle`, `no-arbitrary-values` and `require-static-classes` off, the
same three the plugin's own adoption guide turns off over `components/ui`: the primitives own
their appearance, use `ring-[3px]`, and build classes from their variant functions. The other
three keep checking the primitives.

A consumer that widens an option restates it whole; an override replaces the rule's options, it
does not merge them:

```ts
rules: {
    'shadcn/no-arbitrary-values': ['error', { allow: ['layout', 'grid-cols-*'] }],
    'shadcn/no-restyle': [
        'error',
        { allow: ['layout'], contracts: [{ pattern: '^CardTitle$', allow: ['layout', 'typography'] }] },
    ],
},
```

`settings.shadcn` (`ui` for a component directory `components.json` does not name,
`componentImports`, `ignoreImports`, `mergeFunctions`, `variantFunctions`, `note`) is not
inherited through `extends` under oxlint, so it goes in the consumer's own root config. Neither
rm3 consumer needs it: both have a `components.json` whose `ui` alias resolves through
tsconfig `paths` or package `imports`.

The skill's other Tailwind practices are not lint rules: `@apply` lives in CSS, which oxlint does
not read, and class sorting belongs to `oxfmt` (`sortTailwindcss`), not the linter.

## shadcn rules

`shadcnRulesOn` turns the twenty practices from the global `shadcn` skill's `rules/*.md` that
a linter can decide into ratchets, all from the `rm3-shadcn` plugin in `@rm3/lint` (see
`packages/lint/README.md` for what each one matches). They are shadcn's opinions about app code
that composes the primitives. Raw colors, arbitrary values and unreadable class strings are
`@shadcn/lint`'s rules above, which know the project's theme; these know only the file.

Class-string rules, matching `className` / `class` and the class helpers (`cn`, `clsx`, `cva`,
`twMerge`, `tv`, `twJoin`):

- `rm3-shadcn/no-space-utilities`: no `space-x-*` / `space-y-*`; `flex gap-*`.
- `rm3-shadcn/prefer-size-utility`: `w-10 h-10` in one string is `size-10`.
- `rm3-shadcn/prefer-truncate`: `overflow-hidden text-ellipsis whitespace-nowrap` is `truncate`.
- `rm3-shadcn/no-dark-color-overrides`: no `dark:bg-gray-950`; the semantic token already
  carries a dark value. `dark:bg-success/20` (a token tweak) passes unless `strict: true`.
- `rm3-shadcn/no-conditional-class-template`: no `${open ? "a" : "b"}` inside a `className`
  template; pass the condition to `cn()`.
- `rm3-shadcn/prefer-skeleton`: no `animate-pulse` on a `div` / `span`; `Skeleton` carries the
  pulse, the surface and the radius. A pulsing status dot needs a disable comment.
- `rm3-shadcn/prefer-separator`: no `<hr>`, and no empty `div` / `span` whose only job is a
  `border-t` / `border-b` / `border-l` / `border-r`; `Separator`. A `div` with content keeps its
  border.

Composition rules, matching shadcn component names in JSX:

- `rm3-shadcn/no-ungrouped-items`: `SelectItem` in `SelectContent`, `DropdownMenuItem` in
  `DropdownMenuContent`, `CommandItem` in `CommandList`, `TabsTrigger` in `Tabs`, and the rest of
  the table in the shadcn skill's `composition.md`, each wrapped in its Group. Looks through
  `.map()`. The chat rows (`Message`, `Bubble`, `Attachment` in their groups) are not checked:
  they key on sibling count, which a `.map()` hides.
- `rm3-shadcn/no-button-loading-prop`: no `isLoading` / `isPending` / `loading` on `Button` and
  the button-shaped parts; render `<Spinner data-icon="inline-start" />` and set `disabled`.
- `rm3-shadcn/no-wrapped-trigger`: no `div` / `span` between a `*Trigger` / `*Close` and its one
  child; pass the child directly or through `render`. A wrapper around a `disabled` element
  passes (the tooltip workaround).
- `rm3-shadcn/no-positioned-input-addon`: no `relative` wrapper with an `absolute` button, icon or
  counter over an `Input` / `Textarea`; `InputGroup` + `InputGroupAddon`.
- `rm3-shadcn/require-field-state-pairing`: `data-invalid` on `Field` pairs with `aria-invalid`
  on the control under it, `data-disabled` with `disabled`; either side alone reports. Presence
  only, so `data-invalid={!!error}` with `aria-invalid={!!error}` passes.
- `rm3-shadcn/prefer-marker`: no `Separator` + label + `Separator` row (or one stretched with
  `flex-1` beside a label); `Marker` centers the label and draws the rules.
- `rm3-shadcn/require-parts`: `DialogContent`, `SheetContent`, `DrawerContent` and
  `AlertDialogContent` contain a Title; `Avatar` contains `AvatarFallback`. `{children}`, a
  spread, or a family-named component the rule does not know (`EditProfileDialogBody`) counts as
  content it cannot see and passes.
- `rm3-shadcn/no-raw-input-in-input-group`: `Input` / `Textarea` inside `InputGroup` are
  `InputGroupInput` / `InputGroupTextarea`.
- `rm3-shadcn/no-overlay-z-index`: no `z-*` on `DialogContent`, `PopoverContent`,
  `TooltipContent` and the other overlay surfaces. A plain `div` is not in scope.

Icon rules, recognizing an icon by a `data-icon` attribute, a `*Icon` name, or `Spinner`:

- `rm3-shadcn/require-icon-data-icon`: an icon beside text inside `Button` carries
  `data-icon="inline-start"` or `"inline-end"`. An icon-only button passes.
- `rm3-shadcn/no-icon-size-classes`: no `size-*` / `w-*` / `h-*` on an icon inside `Button`,
  `DropdownMenuItem`, `Alert`, `Badge`, `Sidebar*` and the other hosts that size their icons.

A Tabler project names icons `IconSearch`; set `['error', { iconPrefixes: ['Icon'] }]` on both
icon rules.

Base rules, keyed on the `base` in `components.json`:

- `rm3-shadcn/no-base-api-mismatch`: no Radix props (`asChild`,
  `SelectContent position`, `type` / `collapsible` on `ToggleGroup` / `Accordion`, a string
  `defaultValue` there, `Slider defaultValue={[50]}`) in a Base UI project, and no Base UI props
  (`render={<a />}`, `multiple`, `alignItemWithTrigger`, `itemToStringValue`, a numeric `Slider`
  value, an `Accordion` with no `type`) in a Radix one. `asChild` and `render` together report
  in either mode. `SelectValue placeholder` is not reported: Base UI's `Select.Value` takes it too, so the skill's `{ value: null }` item is a preference. The default is Base UI; a Radix project sets it in its own override:

    ```ts
    rules: {
        'rm3-shadcn/no-base-api-mismatch': ['error', { base: 'radix' }],
    },
    ```

- `rm3-shadcn/require-native-button-false`: `render={<a />}` (or another non-button element) on
  `Button`, `Toggle`, a Dialog / Popover / Menu / Collapsible trigger or close, `SelectTrigger`
  or `TabsTrigger` carries `nativeButton={false}`, so Base UI adds the `role`, `tabIndex` and
  keyboard handling a non-button needs. `TooltipTrigger` and the `SidebarMenu*` buttons have no
  such prop and are not in scope.

All twenty are on for every file and match only JSX and the class helpers, so a Node file
pays nothing. `shadcnRulesOff` turns all twenty off: the primitives themselves use `dark:`
palette variants, `z-50` on their own overlays, `animate-pulse` in `Skeleton`, and compose their
own parts.

The rest of the shadcn skill is not lint rules: "use `Alert` / `Empty` / `Badge` / full `Card`
composition instead of custom markup" is intent, not syntax; `toast` per base depends on what is
installed; `FieldGroup` over a `div` for form layout is covered as far as syntax allows by
`no-space-utilities`.

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
