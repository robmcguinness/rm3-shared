# @rm3/lint

Vendored copy of [`dmmulroy/anti-slop`](https://github.com/dmmulroy/anti-slop) v0.1.2, a set of
Oxlint JS-plugin rules that reject low-evidence TypeScript and JavaScript patterns. Upstream is
not published to npm and is intended to be vendored by copy, so this package inlines the rule
source rather than depending on it.

## What was omitted

- `src/effect/**` — the `effect`-specific rule (`no-service-constructor-imports`). rm3 has
  no `effect` dependency, so it does not apply here.
- `scripts/`, `skills/` — upstream's own tooling, not needed once vendored.

## What was changed from upstream

- Reformatted with `oxfmt` to match this repo's style (tabs, double quotes stay as upstream used
  double quotes already; formatting normalized to the monorepo's oxfmt config).
- `src/rules/no-shape-in-symbol-names.ts`: the rule's `MemberExpression` exemption for non-computed
  properties did not cover type positions. `z.ZodRawShape` in `packages/env/src/index.ts` is a
  `TSQualifiedName` (`Zod.RawShape` shape), not a `MemberExpression`, so it tripped the rule with no
  way to opt out short of a `SAFETY` comment on a type reference. The rule now also exempts
  `parent.type === "TSQualifiedName" && parent.right === node`. A valid test case
  (`declare const s: z.ZodRawShape;`) was added to the rule's test file to lock this in.

Everything else is byte-identical rule logic to upstream, modulo the formatting pass.

## Surface

`src/index.ts` exports:

- `default` — the `eslintCompatPlugin`-wrapped plugin, registered as the `anti-slop` jsPlugin in
  the root `oxlint.config.ts`.
- `antiSlopRules` — the 15 generic rules, all at `error`.
- `complexityRules` — `complexity` at `error` plus the `max-depth` / `max-nested-callbacks` /
  `max-params` nesting family at `warn`.
- `antiSlopRulesOff` — the same keys as `antiSlopRules`, all set to `"off"`. Used to disable the
  plugin against its own source (which inspects ASTs with `typeof` and `unknown` by necessity) and
  against vendored shadcn primitives.

`src/node.ts` (the `@rm3/lint/node` export) is a second plugin, `rm3-node`, written here rather
than vendored. It holds Node runtime rules for patterns oxlint has no built-in rule for (oxlint
has no `no-restricted-syntax`). Kept apart from `anti-slop` so `antiSlopRulesOff` leaves it on.

- `default` — the `eslintCompatPlugin`-wrapped plugin, registered as the `rm3-node` jsPlugin
  by `@rm3/oxlint-config`.
- `nodeCustomRules` — the seven rules at `error`.

| rule                          | reports                                                                                                                                                                                                                                               |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `prefer-timers-promises`      | `new Promise((resolve) => setTimeout(resolve, ms))` and the `setImmediate` form. `node:timers/promises` returns the promise and takes an `AbortSignal`.                                                                                               |
| `no-unguarded-json-parse`     | `JSON.parse(...)` with no enclosing `try` block in the same function. A schema `safeParse` on the result does not catch the `SyntaxError`. Off in `*.test.ts`.                                                                                        |
| `no-manual-signal-handlers`   | `process.on` / `once` / `addListener` for `SIGTERM`, `SIGINT`, `SIGHUP`, `uncaughtException`, `unhandledRejection`, on the global or the `node:process` import.                                                                                       |
| `prefer-err-log-key`          | `log.error({ error }, ...)`: an identifier, member, call or `new` under the `error` key of a log call's fields. pino's error serializer is bound to `err`; anything else is JSON-stringified and an Error becomes `{}`. A string value passes.        |
| `no-log-in-loop`              | A log call in the body of a `for` / `for..of` / `for..in` / `for await` / `while` / `do..while` in the same function. Stops at the nearest function, so a callback declared inside the loop passes; `forEach` / `map` are calls, not loops, and pass. |
| `no-json-stringify-log`       | `JSON.stringify(...)` in the message slot of a log call (first argument, or second after a fields object). A stringified field value (`{ payload: JSON.stringify(x) }`) passes.                                                                       |
| `no-log-string-interpolation` | A log message built with `${}` or `+` (`log.info(\`user ${id} created\`)`), in the first or, after a fields object, the second argument. Constant templates and pino's `%s` placeholders pass.                                                        |

The four log rules match pino-shaped calls only: a level method (`trace`..`fatal`) on `x.log`
(`request.log`, `app.log`, `this.log`), a bare `log` / `logger`, or a `getLog()` / `getLogger(ctx)`
call. A `??` / `||` between any of those logger shapes is also matched. `console.*` and a
`.child()` result are not matched.

`src/tailwind.ts` (the `@rm3/lint/tailwind` export) is a third plugin, `rm3-tailwind`, for the two
Tailwind practices a linter can check from class strings alone; `skills/rm3-tailwind` defers them
here under "Enforced by lint". Also kept apart from `anti-slop`; `shadcnRulesOff` in
`@rm3/oxlint-config` turns both off by name over vendored primitives.

- `default` — the `eslintCompatPlugin`-wrapped plugin, registered as the `rm3-tailwind` jsPlugin
  by `@rm3/oxlint-config`.
- `tailwindCustomRules` — the two rules at `error`.

| rule                     | reports                                                                                                                                                                                                                                                                                                               |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `no-arbitrary-values`    | `bg-[#fff]`, `p-[13px]`, `[mask-type:luminance]` in a class string, unless the utility prefix is in `allow` (default `h-`, `w-`, `min-h-`, `max-h-`, `min-w-`, `max-w-`). Arbitrary variants (`data-[state=open]:`) and the v4 variable shorthand (`bg-(--brand)`) are not values. Modifiers (`/[0.37]`) are ignored. |
| `no-dynamic-class-names` | A `${}` or `+` glued to text inside a class string: `bg-${color}-600`, `'text-' + size`. Whole-token interpolation (`${base} ${extra}`) passes.                                                                                                                                                                       |

Both look at JSX `className`/`class` attributes and at string arguments to the class helpers in
`callees` (default `cn`, `clsx`, `cva`, `twMerge`, `tv`, `twJoin`), recursing through arrays,
object keys and values, ternaries, logical expressions and TypeScript casts. A template literal
tagged with a callee (`tw\`...\``) counts too.

`src/shadcn.ts` (the `@rm3/lint/shadcn` export) is a fourth plugin, `rm3-shadcn`, for the twelve
numbered practices in `skills/rm3-shadcn`, each decidable from JSX and class strings. Kept apart from
`rm3-tailwind` because they are shadcn's opinions about composing the primitives, not Tailwind's;
`shadcnRulesOff` turns all twelve off over vendored primitives.

- `default` — the `eslintCompatPlugin`-wrapped plugin, registered as the `rm3-shadcn` jsPlugin
  by `@rm3/oxlint-config`.
- `shadcnCustomRules` — the twelve rules at `error`.

| rule                            | reports                                                                                                                                                                                                                                                                                                                                                                                                            |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `no-space-utilities`            | A `space-x-*` / `space-y-*` token (including `-reverse`) in a class string.                                                                                                                                                                                                                                                                                                                                        |
| `prefer-size-utility`           | A `w-<v>` and `h-<v>` with the same value and the same variant chain in one literal or template chunk (`md:w-4 md:h-4`; not `w-4 md:h-4`, not `w-4` and `h-4` in two `cn` arguments). `screen` has no `size-` form and passes.                                                                                                                                                                                     |
| `prefer-truncate`               | `overflow-hidden`, `text-ellipsis` and `whitespace-nowrap` under the same variant chain in one literal or chunk.                                                                                                                                                                                                                                                                                                   |
| `no-palette-colors`             | A color utility (`bg-`, `text-`, `border-*`, `ring-`, `fill-`, `from-`, `shadow-`, …) whose value is a default palette color (`blue-500`, `gray-50`, `white`, `black`). Semantic tokens (`bg-primary`, `bg-success/20`, `bg-brand-500`) pass. A token under `dark:` is `no-dark-color-overrides`' business. `allow` lists values to permit.                                                                        |
| `no-dark-color-overrides`       | A `dark:` variant on a color utility with a palette value (`dark:bg-gray-950`, `dark:text-white`). With `strict: true`, any `dark:` color utility, including a semantic token.                                                                                                                                                                                                                                     |
| `no-conditional-class-template` | A `ConditionalExpression` or `LogicalExpression` interpolated into a `className` template or `+` chain. Only the JSX attribute; a helper call like `cn(\`…\`)` is not read.                                                                                                                                                                                                                                        |
| `no-ungrouped-items`            | An item (`SelectItem`, `SelectLabel`, `DropdownMenuItem`, `DropdownMenuLabel`, `DropdownMenuSub`, `MenubarItem`, `ContextMenuItem`, `CommandItem`, `TabsTrigger`, `MessageScrollerItem`) whose nearest enclosing JSX element is its content container rather than its Group. The walk looks through fragments, `{cond && …}` and `.map()` callbacks, and stops at a prop (`render={…}`).                           |
| `require-parts`                 | `DialogContent`, `SheetContent`, `DrawerContent`, `AlertDialogContent` with no matching Title element anywhere under it, or `Avatar` with no `AvatarFallback`. Skipped when the container has `{children}`, another opaque expression, a spread attribute, a `children` prop, or a family-named component the rule does not know (`EditProfileDialogBody`). A nested container of the same family is not searched. |
| `no-raw-input-in-input-group`   | `Input` or `Textarea` with an `InputGroup` ancestor, unless a `*Content` element (a portal) sits between them.                                                                                                                                                                                                                                                                                                     |
| `no-overlay-z-index`            | A `z-*` token in the `className` of an overlay surface (`DialogContent`, `DialogOverlay`, `SheetContent`, `DrawerContent`, `AlertDialogContent`, `DropdownMenuContent`, `PopoverContent`, `TooltipContent`, `HoverCardContent`, `SelectContent`, …). The attribute's helper calls are read whatever the callee.                                                                                                    |
| `require-icon-data-icon`        | An icon element that is a direct child of `Button` alongside at least one other meaningful child, with no `data-icon` attribute and no spread.                                                                                                                                                                                                                                                                     |
| `no-icon-size-classes`          | An icon element with a `size-*` / `w-*` / `h-*` token in its `className`, when it carries `data-icon` or its enclosing element is a host that sizes icons (`Button`, `DropdownMenuItem`, `SelectItem`, `CommandItem`, `Alert`, `Badge`, `Toggle*`, `InputGroupAddon`, `EmptyMedia`, `ItemMedia`, `TabsTrigger`, `Sidebar*`, …). One report per icon.                                                               |

An icon element is one with a `data-icon` attribute, a name in `iconNames` (default `Spinner`),
a name ending in one of `iconSuffixes` (default `Icon`), or starting with one of `iconPrefixes`
(default none; Tabler sets `['Icon']`). The class-string rules take the same `callees` option as
the Tailwind rules.

`src/fastify.ts` (the `@rm3/lint/fastify` export) is a fifth plugin, `rm3-fastify`, for the
practices in the `fastify-best-practices` skill a linter can decide from the call shape. Kept
apart from `rm3-node` because the rules key on Fastify's API rather than on Node.

- `default` — the `eslintCompatPlugin`-wrapped plugin, registered as the `rm3-fastify` jsPlugin
  by `@rm3/oxlint-config`.
- `fastifyCustomRules` — the five rules at `error`.

| rule                         | reports                                                                                                                                                                                                                                                                                          |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `return-reply`               | `reply.send(...)`, `.redirect`, `.callNotFound` or `.sendFile` as a bare statement (not returned, not awaited) inside an async handler or hook, where `reply` is that function's own parameter. A sync handler, a nested callback, or a local named `reply` passes.                              |
| `no-callback-hooks`          | `addHook(name, fn)` or a route-option hook (`{ preHandler: [fn] }`) whose function takes more parameters than the hook's async signature, i.e. a `done`. Reported for sync and async functions alike; `onRoute` / `onRegister` are sync by design and skipped, as is a hook passed by reference. |
| `no-default-request-logging` | A `fastify()` options literal with `loggerInstance`, or a `logger` other than `false`, and neither a `logController` nor a `disableRequestLogging` that is not literally `false`. Opaque options pass.                                                                                           |
| `require-gen-req-id`         | A call to the `fastify` default (or named `fastify`) import with no options, or an options literal with no `genReqId`. An identifier, a call, or a spread in the options is opaque and passes.                                                                                                   |
| `require-plugin-name`        | A call to the `fastify-plugin` default (or `fastifyPlugin`) import with no second argument, a string second argument, or an options literal with no `name`. An identifier or a spread in the options is opaque and passes.                                                                       |

The Fastify factory rules do not match a namespace import such as
`import * as f from 'fastify'; f.fastify()`.

A function counts as a Fastify handler when it is an argument to `get` / `head` / `post` / `put`
/ `delete` / `options` / `patch` / `all` / `route` / `addHook` / `setErrorHandler` /
`setNotFoundHandler`, sits under `handler`, `errorHandler` or a hook name in route options, or
has a parameter typed `FastifyRequest` / `FastifyReply`. The match is by name, so an Express
`router.get` handler looks the same; the rm3 stack has no Express.

Each rule has a co-located `*.test.ts` driven by `RuleTester` from `oxlint/plugins-dev`.

This package is source-only: `exports` points straight at `./src/index.ts`, no build step, no
`dist`. Oxlint's plugin loader does a plain `await import(url)`, which resolves under Node's
built-in TypeScript type stripping.
