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

This package is source-only: `exports` points straight at `./src/index.ts`, no build step, no
`dist`. Oxlint's plugin loader does a plain `await import(url)`, which resolves under Node's
built-in TypeScript type stripping.
