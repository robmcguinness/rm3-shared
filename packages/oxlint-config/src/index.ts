// Type-only import: erased at runtime, so importing this module never binds
// rm3-shared's copy of oxlint into a consumer's process. `defineConfig` is
// deliberately never CALLED here — the consumer calls it on its own oxlint.
import type { OxlintConfig } from 'oxlint';
import type { Capability, RuleFramework } from 'oxlint-plugin-react-doctor/core';

import { antiSlopRules, antiSlopRulesOff, complexityRules } from '@rm3/lint';
import { fastifyCustomRules } from '@rm3/lint/fastify';
import { nodeCustomRules } from '@rm3/lint/node';
import { shadcnCustomRules } from '@rm3/lint/shadcn';
import { tailwindCustomRules } from '@rm3/lint/tailwind';
// The `core` entry is rule metadata only (31 ms to import); the root entry is
// the plugin itself, which oxlint loads through `reactDoctorJsPlugin` below.
import { REACT_DOCTOR_RULES } from 'oxlint-plugin-react-doctor/core';

export {
  antiSlopRules,
  antiSlopRulesOff,
  complexityRules,
  fastifyCustomRules,
  nodeCustomRules,
  shadcnCustomRules,
  tailwindCustomRules,
};

/**
 * React plugins already in `rm3Config.plugins`. Exported for consumer
 * overrides that set their own `plugins`, which replaces the base list,
 * and must add React back.
 */
export const reactPlugins = ['react', 'react-perf', 'jsx-a11y'] as const;

/**
 * React rules that `rm3Config.categories` would not turn on (they sit in
 * `style`, `restriction` or `nursery`), opted in by name.
 * react-doctor ships a JS port of each of these, and `reactDoctorRules` leaves
 * every port off because oxlint's Rust rule is the one that runs. So oxlint has
 * to run them or nothing does; `index.test.ts` fails when a rule react-doctor
 * recommends is neither on by category nor named in `reactRules`.
 */
export const reactRulesOn = {
  // --- bugs, promoted to error ---
  // Pedantic in oxlint, so `warn` by category. A hook call inside a condition
  // is never a preference; react-doctor also had it at error.
  'react/rules-of-hooks': 'error',
  // `class=`, `for=`, `onclick=`: the attribute silently does nothing.
  'react/no-unknown-property': 'error',
  // A `<button>` without `type` submits the enclosing form. Off over shadcn
  // primitives in `shadcnRulesOff`; app code uses `<Button>` and is unaffected.
  'react/button-has-type': 'error',
  // `shouldComponentUpdate` on a `PureComponent` is dead code.
  'react/no-redundant-should-component-update': 'error',
  // --- nursery, so `warn` like `no-useless-assignment` below ---
  'react/require-render-return': 'warn',
  // --- a11y ---
  // "click here" / "link" anchor text tells a screen reader nothing.
  'jsx-a11y/anchor-ambiguous-text': 'warn',
  // --- style: autofixable, one commit to adopt ---
  'react/jsx-boolean-value': 'warn',
  'react/jsx-curly-brace-presence': 'warn',
  'react/jsx-fragments': 'warn',
  'react/jsx-pascal-case': 'warn',
  'react/self-closing-comp': 'warn',
  // `const [x, setX]` naming for `useState`.
  'react/hook-use-state': 'warn',
  // --- class-component ratchets: no hits today, keep it that way ---
  'react/no-set-state': 'warn',
  'react/prefer-es6-class': 'warn',
  // `allowComponentDidCatch` is on by default, so error boundaries still pass.
  'react/prefer-function-component': 'warn',
  'react/state-in-constructor': 'warn',
  // Legacy APIs with modern replacements (render props, `props.children`).
  'react/no-clone-element': 'warn',
  'react/no-react-children': 'warn',
} satisfies NonNullable<OxlintConfig['rules']>;

/**
 * The rules `reactRulesOff` turns off, named so the binding has an owner
 * contract instead of an inline object type. The annotation itself is
 * load-bearing: it keeps each value at the literal `'off'` while leaving the
 * object mutable, which is the shape oxlint's `Config['rules']` accepts.
 */
type ReactRulesOff = {
  'jsx-a11y/label-has-associated-control': 'off';
  'react-perf/jsx-no-jsx-as-prop': 'off';
  'react-perf/jsx-no-new-array-as-prop': 'off';
  'react-perf/jsx-no-new-function-as-prop': 'off';
  'react-perf/jsx-no-new-object-as-prop': 'off';
  'react/forbid-component-props': 'off';
  'react/forbid-dom-props': 'off';
  'react/forbid-elements': 'off';
  'react/jsx-filename-extension': 'off';
  'react/jsx-handler-names': 'off';
  'react/jsx-max-depth': 'off';
  'react/jsx-props-no-spreading': 'off';
  'react/no-danger': 'off';
  'react/no-multi-comp': 'off';
  'react/only-export-components': 'off';
  'react/react-in-jsx-scope': 'off';
};

/**
 * React rules turned off on purpose; part of `rm3Config.rules` via `reactRules`.
 * Spread into `reactRules`; every entry is a recorded decision, so the drift
 * test in `index.test.ts` counts it as covered.
 */
export const reactRulesOff: ReactRulesOff = {
  // React 17+ JSX transform doesn't require React in scope
  'react/react-in-jsx-scope': 'off',
  // Inline callbacks and literals in props are the normal React idiom;
  // memoizing every one of them costs more than it saves.
  'react-perf/jsx-no-jsx-as-prop': 'off',
  'react-perf/jsx-no-new-array-as-prop': 'off',
  'react-perf/jsx-no-new-function-as-prop': 'off',
  'react-perf/jsx-no-new-object-as-prop': 'off',
  // Generic Label component — htmlFor passed via props
  'jsx-a11y/label-has-associated-control': 'off',
  // --- Named off so the drift test sees a decision, not a gap ---
  // Default ban list is `className` and `style` on components. Every primitive
  // in a shadcn-style codebase takes `className`.
  'react/forbid-component-props': 'off',
  // Ban lists with no default. rm3 has nothing to ban; a repo that does names
  // it in its own override.
  'react/forbid-dom-props': 'off',
  'react/forbid-elements': 'off',
  // TypeScript already rejects JSX in a `.ts` file.
  'react/jsx-filename-extension': 'off',
  // `handle*` / `on*` naming is a convention, not a bug.
  'react/jsx-handler-names': 'off',
  // Default depth is 2. Same reason `complexity` is off for `.tsx`: it
  // measures markup, not logic.
  'react/jsx-max-depth': 'off',
  // `{...props}` forwarding is the primitive idiom.
  'react/jsx-props-no-spreading': 'off',
  // `dangerouslySetInnerHTML` carries trusted static content only (inline SVG,
  // anti-FOUC theme script, chart CSS vars). Decision recorded in openmint.
  'react/no-danger': 'off',
  // Routes and feature files co-locate small helper components by design.
  'react/no-multi-comp': 'off',
  // TanStack route files export `Route` beside the component, and cva variants
  // export beside theirs. Fast Refresh is not worth that noise.
  'react/only-export-components': 'off',
};

/**
 * Already spread into `rm3Config.rules`; exported for overrides that redefine
 * `plugins` and for the test. `reactRulesOff` wins on any key that
 * appears in both, which is the point: a reasoned `off` beats an opt-in.
 */
export const reactRules = {
  ...reactRulesOn,
  ...reactRulesOff,
} satisfies NonNullable<OxlintConfig['rules']>;

/**
 * The react-doctor JS plugin, resolved HERE like `perfectionist` so the pinned
 * copy in rm3-shared/node_modules loads even through a `link:` symlink.
 * Already in `rm3Config.jsPlugins`; loading costs ~140 ms once per run.
 * The `js-*` rules are generic JS perf checks that earn it in Node code too.
 */
export const reactDoctorJsPlugin = {
  name: 'react-doctor',
  specifier: import.meta.resolve('oxlint-plugin-react-doctor'),
} satisfies NonNullable<OxlintConfig['jsPlugins']>[number];

/**
 * react-doctor ports 100 rules from oxlint's own `react`, `react-perf` and
 * `jsx-a11y` plugins and flags them `originallyExternal`. The Rust originals
 * run under `reactPlugins`, so the ports stay off. These eight are the only
 * other `originallyExternal` rules react-doctor recommends: they come from
 * `eslint-plugin-react-you-might-not-need-an-effect`, which oxlint does not
 * ship, so they stay on. `index.test.ts` recomputes the split from
 * `oxlint --rules` and fails when a bump on either side moves a rule.
 */
const effectRuleIds: ReadonlySet<string> = new Set([
  'no-adjust-state-on-prop-change',
  'no-chain-state-updates',
  'no-derived-state',
  'no-event-handler',
  'no-initialize-state',
  'no-pass-data-to-parent',
  'no-pass-live-state-to-parent',
  'no-reset-all-state-on-prop-change',
]);

/**
 * react-doctor's CLI reads `package.json` and gates each rule on what it finds
 * (`requires` / `disabledWhen`). Standalone oxlint runs whatever is named, so
 * this file answers the same questions by hand. Most gates need no answer: a
 * `three` or `zustand` rule matches only that library's code, so it is silent
 * everywhere else. These three name the *environment*, not an import, and
 * their rules fire on ordinary code (`react-compiler` flags every `useMemo`).
 * They are out of `reactDoctorRules`; a consumer spreads the matching bucket
 * of `reactDoctorCapabilityRules` when the capability applies.
 */
const environmentCapabilities = ['i18n', 'react-compiler', 'ssr'] as const;

type EnvironmentCapability = (typeof environmentCapabilities)[number];

/**
 * What every rm3 React repo has. `react:N` reads as "React N or newer", so a
 * React 19 repo carries the 18 line too: `no-react-dom-deprecated-apis`
 * (requires 18) stays on, `no-ref-callback-cleanup-before-react-19`
 * (disabled when 19) goes off.
 */
const assumedCapabilities: ReadonlySet<Capability> = new Set<Capability>([
  'react',
  'react:18',
  'react:19',
  'react:19.2',
]);

type ReactDoctorEntry = (typeof REACT_DOCTOR_RULES)[number];

type ReactDoctorRuleMap = Record<string, 'error' | 'off' | 'warn'>;

/**
 * Whether a rule can run, and should run, under standalone oxlint at all:
 * scan and project rules need the CLI's whole-tree pass and are no-ops here;
 * `defaultEnabled: false` and `opt-in` rules are off in the CLI too; and the
 * oxlint ports are covered by `reactPlugins`.
 */
const runsHere = ({ id, originallyExternal, rule }: ReactDoctorEntry): boolean =>
  rule.defaultEnabled !== false &&
  !rule.isScanRule &&
  rule.isProjectRule !== true &&
  !(rule.tags ?? []).includes('opt-in') &&
  (!originallyExternal || effectRuleIds.has(id));

const isEnvironmentCapability = (capability: Capability): boolean =>
  environmentCapabilities.some((environment) => environment === capability);

const toRuleMap = (entries: ReactDoctorEntry[], severity?: 'off'): ReactDoctorRuleMap =>
  Object.fromEntries(entries.map(({ key, rule }) => [key, severity ?? rule.severity]));

/**
 * react-doctor's recommended set for one framework at react-doctor's own
 * severities, for a repo with `assumedCapabilities` and none of
 * `environmentCapabilities`.
 */
const reactDoctorRulesFor = (framework: RuleFramework): ReactDoctorRuleMap =>
  toRuleMap(
    REACT_DOCTOR_RULES.filter(
      (entry) =>
        entry.rule.framework === framework &&
        runsHere(entry) &&
        !(entry.rule.requires ?? []).some(isEnvironmentCapability) &&
        !(entry.rule.disabledWhen ?? []).some((capability) => assumedCapabilities.has(capability)),
    ),
  );

/**
 * The rules one environment capability switches on, plus the base rules it
 * switches off, in one spreadable map.
 */
const reactDoctorCapabilityRulesFor = (capability: EnvironmentCapability) => {
  const global = REACT_DOCTOR_RULES.filter(
    (entry) => entry.rule.framework === 'global' && runsHere(entry),
  );
  return {
    ...toRuleMap(global.filter((entry) => new Set(entry.rule.requires).has(capability))),
    ...toRuleMap(
      global.filter((entry) => new Set(entry.rule.disabledWhen).has(capability)),
      'off',
    ),
  };
};

/**
 * react-doctor rules that re-implement a check oxlint already runs under
 * `rm3Config`. The Rust rule reports it, so the port is off; the value names
 * the oxlint rule that owns it, and `index.test.ts` fails if that rule is not
 * on. Partial overlaps stay on and are only noted here: `js-set-map-lookups`
 * (unicorn/prefer-set-has covers `.includes` on a constant array, not the
 * lookup-in-loop shape) and `no-mutating-array-method-on-prop-or-hook-result`
 * (unicorn/no-array-sort covers `.sort()` only, not `.reverse()`/`.splice()`).
 */
export const reactDoctorOxlintCounterparts = {
  // Both flag `[...a].sort()` and offer the same `toSorted()` fix.
  'react-doctor/js-tosorted-immutable': 'unicorn/no-array-sort',
  'react-doctor/no-array-index-as-key': 'react/no-array-index-key',
  'react-doctor/no-eval': 'no-eval',
  'react-doctor/no-spread-accumulator-in-reduce': 'oxc/no-accumulating-spread',
} as const satisfies Record<string, string>;

export const reactDoctorRulesCoveredByOxlint: ReactDoctorRuleMap = Object.fromEntries(
  Object.keys(reactDoctorOxlintCounterparts).map((key) => [key, 'off' as const]),
);

/**
 * Recommended react-doctor rules that rm3 turns off. Each one restates a
 * decision `rm3Config` already made for the matching oxlint rule, so the two
 * tools cannot disagree about it.
 */
export const reactDoctorRulesOff = {
  // Same decision as `no-await-in-loop` off in `rm3Config.rules`:
  // react-doctor's copy would quietly re-enable it.
  'react-doctor/async-await-in-loop': 'off',
  // Same decision as `complexity` off for `.tsx` in `rm3Config.overrides`:
  // in a render body every `&&` and ternary is a display ladder, not control
  // flow, so the count measures markup.
  'react-doctor/no-high-complexity-react-function': 'off',
  // Same decision as `max-lines-per-function` off: length says nothing useful.
  'react-doctor/no-giant-component': 'off',
  // Same decision as `react/no-multi-comp` in `reactRulesOff`: routes and
  // feature files co-locate small helper components by design.
  'react-doctor/no-multi-component-file': 'off',
} satisfies ReactDoctorRuleMap;

/**
 * Framework-independent react-doctor rules, part of `rm3Config.rules`.
 * Rules tagged `test-noise` skip `*.test.*` and `__tests__/`
 * files on their own, so no test override is needed.
 */
export const reactDoctorRules = Object.assign(
  reactDoctorRulesFor('global'),
  reactDoctorRulesCoveredByOxlint,
  reactDoctorRulesOff,
);

/**
 * Framework-specific react-doctor rules, keyed by react-doctor's framework
 * name. Spread the ones the repo uses, e.g.
 * `...reactDoctorFrameworkRules['tanstack-query']`. react-doctor's CLI detects
 * the framework from `package.json`; standalone oxlint cannot, so this is an
 * explicit opt-in.
 */
export const reactDoctorFrameworkRules: Record<
  Exclude<RuleFramework, 'global'>,
  ReactDoctorRuleMap
> = {
  nextjs: reactDoctorRulesFor('nextjs'),
  preact: reactDoctorRulesFor('preact'),
  'react-native': reactDoctorRulesFor('react-native'),
  'tanstack-query': reactDoctorRulesFor('tanstack-query'),
  'tanstack-start': reactDoctorRulesFor('tanstack-start'),
};

/**
 * Environment-specific react-doctor rules. Spread AFTER `reactDoctorRules`:
 * `ssr` for a server-rendered app (TanStack Start, Next), `react-compiler`
 * when the compiler is on (it also turns the manual-memoization rules off),
 * `i18n` for an app that ships to CJK users (IME composition guards).
 */
export const reactDoctorCapabilityRules: Record<EnvironmentCapability, ReactDoctorRuleMap> = {
  i18n: reactDoctorCapabilityRulesFor('i18n'),
  'react-compiler': reactDoctorCapabilityRulesFor('react-compiler'),
  ssr: reactDoctorCapabilityRulesFor('ssr'),
};

/**
 * The `rm3-node` plugin from `@rm3/lint`, resolved HERE like `anti-slop` so
 * the copy in rm3-shared loads through a `link:` symlink. Already in
 * `rm3Config.jsPlugins`; exported for the test and for consumer overrides.
 */
export const rm3NodeJsPlugin = {
  name: 'rm3-node',
  specifier: import.meta.resolve('@rm3/lint/node'),
} satisfies NonNullable<OxlintConfig['jsPlugins']>[number];

/**
 * The `rm3-tailwind` plugin from `@rm3/lint`, resolved HERE for the same
 * reason as `rm3NodeJsPlugin`. Already in `rm3Config.jsPlugins`; exported for
 * the test and for consumer overrides.
 */
export const rm3TailwindJsPlugin = {
  name: 'rm3-tailwind',
  specifier: import.meta.resolve('@rm3/lint/tailwind'),
} satisfies NonNullable<OxlintConfig['jsPlugins']>[number];

/**
 * The `rm3-shadcn` plugin from `@rm3/lint`, resolved HERE for the same
 * reason as `rm3NodeJsPlugin`. Already in `rm3Config.jsPlugins`; exported for
 * the test and for consumer overrides.
 */
export const rm3ShadcnJsPlugin = {
  name: 'rm3-shadcn',
  specifier: import.meta.resolve('@rm3/lint/shadcn'),
} satisfies NonNullable<OxlintConfig['jsPlugins']>[number];

/**
 * The `rm3-fastify` plugin from `@rm3/lint`, resolved HERE for the same
 * reason as `rm3NodeJsPlugin`. Already in `rm3Config.jsPlugins`; exported for
 * the test and for consumer overrides.
 */
export const rm3FastifyJsPlugin = {
  name: 'rm3-fastify',
  specifier: import.meta.resolve('@rm3/lint/fastify'),
} satisfies NonNullable<OxlintConfig['jsPlugins']>[number];

/**
 * Packages the `node` and `rm3-nodejs` skills replace with a built-in, each
 * with the replacement in its message. One list feeds both the base
 * `no-restricted-imports` and the test override, which has to restate it
 * because an override replaces a rule's options rather than merging them.
 */
export const restrictedImportPaths = [
  // environment.md: `--env-file` / `@rm3/env` load the file; nothing to import.
  { message: 'Use `node --env-file` or `@rm3/env`; Node loads .env itself.', name: 'dotenv' },
  {
    message: 'Use `node --env-file` or `@rm3/env`; Node loads .env itself.',
    name: 'dotenv/config',
  },
  // fetch-and-http.md: global fetch with `AbortSignal.timeout`.
  { message: 'Use the global fetch with AbortSignal.timeout().', name: 'node-fetch' },
  { message: 'Use the global fetch with AbortSignal.timeout().', name: 'cross-fetch' },
  { message: 'Use the global fetch with AbortSignal.timeout().', name: 'axios' },
  { message: 'Use the global fetch with AbortSignal.timeout().', name: 'got' },
  // Built into node:crypto and node:fs/promises.
  { message: "Use randomUUID() from 'node:crypto'.", name: 'uuid' },
  { message: "Use rm(path, { recursive: true }) from 'node:fs/promises'.", name: 'rimraf' },
  { message: "Use mkdir(path, { recursive: true }) from 'node:fs/promises'.", name: 'mkdirp' },
  { message: "Use glob() from 'node:fs/promises'.", name: 'glob' },
  { message: "Use glob() from 'node:fs/promises'.", name: 'fast-glob' },
  // testing.md: node:test is the runner; undici's MockAgent is allowed for fetch.
  { message: "Use 'node:test' and 'node:assert/strict'.", name: 'vitest' },
  { message: "Use 'node:test' and 'node:assert/strict'.", name: 'jest' },
  { message: "Use 'node:test' and 'node:assert/strict'.", name: '@jest/globals' },
  { message: "Use 'node:test' and 'node:assert/strict'.", name: 'mocha' },
  { message: "Use 'node:test' and 'node:assert/strict'.", name: 'chai' },
  { message: "Use t.mock from 'node:test'.", name: 'sinon' },
  // logging.md: pino, through @rm3/logger.
  { message: "Use pino through '@rm3/logger'.", name: 'winston' },
  { message: "Use pino through '@rm3/logger'.", name: 'bunyan' },
  { message: "Use pino through '@rm3/logger'.", name: 'log4js' },
  { message: "Use pino through '@rm3/logger'.", name: 'consola' },
  { message: "Use pino through '@rm3/logger'.", name: 'signale' },
  // The legacy assert module has loose equality; every rm3 test uses strict.
  { message: "Import from 'node:assert/strict'.", name: 'node:assert' },
  // One name for a test case. `it` reads as BDD but node:test is not.
  { importNames: ['it'], message: 'Use `test`.', name: 'node:test' },
];

/**
 * Node rules from the off `style`, `restriction` and `nursery` categories,
 * opted in by name, plus the seven `rm3-node` plugin rules. Each one encodes
 * a practice from the global `node` skill, `skills/rm3-nodejs` or the
 * `logging-best-practices` skill; the
 * comment names the rule file it comes from. Both consumer repos passed
 * every one of these at zero or near-zero hits when it was added, so they
 * are ratchets, not cleanups.
 */
export const nodeRulesOn = {
  // --- modules.md / typescript.md: ESM under type stripping ---
  // `node:` prefix on every builtin.
  'unicorn/prefer-node-protocol': 'error',
  // No `require`, `module.exports`, `__dirname`; the CJS-only `node/*` rules
  // in `nodeRulesOff` are covered by this one.
  'unicorn/prefer-module': 'error',
  // Relative imports carry their `.ts` extension: Node resolves nothing else,
  // and Vite under `react-vite.json` accepts the same spelling. Bundler
  // aliases (`@/components/ui/card`) are not packages, so they are named here;
  // `#env`-style subpath imports already pass.
  'import/extensions': [
    'error',
    'always',
    {
      ignorePackages: true,
      pathGroupOverrides: [
        { action: 'ignore', pattern: '@/**' },
        { action: 'ignore', pattern: '~/**' },
      ],
    },
  ],
  // `import { type A } from` with only types leaves a side-effect import
  // behind under `verbatimModuleSyntax`.
  'typescript/no-import-type-side-effects': 'error',
  // `__dirname + '/x'` breaks on Windows and under ESM; `join` or `new URL`.
  'node/no-path-concat': 'error',

  // --- async-patterns.md ---
  'promise/no-nesting': 'error',
  'promise/no-return-wrap': 'error',
  'promise/param-names': 'error',
  // Async/await over `.then` chains. The promise-chain-tail idiom in a mutex
  // keeps a named per-line disable.
  'promise/prefer-await-to-then': 'error',
  // Nursery, so `warn`; the pre-commit gate still blocks on it.
  'promise/no-return-in-finally': 'warn',
  // `setTimeout(fn)` with no delay is `setImmediate` spelled ambiguously.
  'unicorn/explicit-timer-delay': 'error',
  // rm3-nodejs async-patterns.md: `node:timers/promises`.
  'rm3-node/prefer-timers-promises': nodeCustomRules['rm3-node/prefer-timers-promises'],

  // --- error-handling.md ---
  'unicorn/error-message': 'error',
  'unicorn/throw-new-error': 'error',
  // A custom error sets `name` and ends in `Error`, or `instanceof` and log
  // output lie about what it is.
  'unicorn/custom-error-definition': 'error',
  'unicorn/no-useless-error-capture-stack-trace': 'error',
  // `catch {` when the error is unused; `catch (cause)` when it is.
  'unicorn/prefer-optional-catch-binding': 'error',
  // `.catch((error: any) => ...)` is the one place `any` sneaks back in.
  'typescript/use-unknown-in-catch-callback-variable': 'error',
  // A callback's `err` argument is handled or the callback is wrong.
  'node/handle-callback-err': 'error',
  // A zod `safeParse` on the result does not catch the `SyntaxError`.
  'rm3-node/no-unguarded-json-parse': nodeCustomRules['rm3-node/no-unguarded-json-parse'],

  // --- graceful-shutdown.md / performance.md ---
  // close-with-grace ends the process; a CLI entrypoint takes a named disable.
  'unicorn/no-process-exit': 'error',
  // close-with-grace also owns the signal and fatal-error listeners.
  'rm3-node/no-manual-signal-handlers': nodeCustomRules['rm3-node/no-manual-signal-handlers'],
  // Sync I/O blocks the event loop. Module-level reads at startup are fine;
  // tests turn this off in `nodeTestRulesOff`.
  'node/no-sync': ['error', { allowAtRootLevel: true }],

  // --- rm3-nodejs modern-js-features.md ---
  'unicorn/prefer-structured-clone': 'error',

  // --- logging.md (fastify-best-practices) and logging-best-practices, pino through @rm3/logger ---
  // pino's error serializer is bound to `err`; `{ error }` logs `{}`.
  'rm3-node/prefer-err-log-key': nodeCustomRules['rm3-node/prefer-err-log-key'],
  // A constant message with the values as fields; `${}` makes every line unique.
  'rm3-node/no-log-string-interpolation': nodeCustomRules['rm3-node/no-log-string-interpolation'],
  // logging-best-practices structure.md: pino serializes the fields object; `JSON.stringify` lands it in `msg`.
  'rm3-node/no-json-stringify-log': nodeCustomRules['rm3-node/no-json-stringify-log'],
  // logging-best-practices pitfalls.md: one event after the loop, not one line per iteration.
  'rm3-node/no-log-in-loop': nodeCustomRules['rm3-node/no-log-in-loop'],

  // --- environment.md, logging.md, testing.md: built-ins over packages ---
  'no-restricted-imports': ['error', { paths: restrictedImportPaths }],
} satisfies NonNullable<OxlintConfig['rules']>;

/**
 * Node rules turned off on purpose, each a recorded decision. Spread into
 * `nodeRules` after `nodeRulesOn`, so a reasoned `off` beats an opt-in.
 */
export const nodeRulesOff = {
  // Conflicts with `unicorn/prefer-top-level-await`, on via `pedantic`, and
  // rm3-nodejs project-setup.md recommends top-level await.
  'node/no-top-level-await': 'off',
  // Wrapping a callback or socket API in `new Promise` is the documented
  // pattern; `rm3-node/prefer-timers-promises` catches the one misuse.
  'promise/avoid-new': 'off',
  // Fires on the `(err, data)` shape inside those same wrappers.
  'promise/prefer-await-to-callbacks': 'off',
  // Would flag every kysely `.execute()` forwarder that returns a promise
  // without awaiting it.
  'typescript/promise-function-async': 'off',
  // Fastify plugins, `*.config.ts`, Playwright and Astro configs, and email
  // templates all export default by contract.
  'import/no-default-export': 'off',
  // A consumer turns this on for an isomorphic package (machdown's contract).
  'import/no-nodejs-modules': 'off',
  // CommonJS-only rules; `unicorn/prefer-module` above rejects the whole
  // module system, so these never get a chance to fire.
  'node/callback-return': 'off',
  'node/exports-style': 'off',
  'node/global-require': 'off',
  'node/no-exports-assign': 'off',
  'node/no-mixed-requires': 'off',
  'node/no-new-require': 'off',
} satisfies NonNullable<OxlintConfig['rules']>;

/** Already spread into `rm3Config.rules`; exported for overrides that redefine `plugins`. */
export const nodeRules = {
  ...nodeRulesOn,
  ...nodeRulesOff,
} satisfies NonNullable<OxlintConfig['rules']>;

/**
 * Node rules relaxed in the test-file override (the `*.test.ts` glob),
 * already part of `rm3Config`. Exported for a consumer whose tests live under
 * a different glob (`*.test.tsx`, a `tests` directory).
 */
export const nodeTestRulesOff = {
  // `mkdtempSync` and friends in test setup are the point, not a hazard.
  'node/no-sync': 'off',
  // A throwing parse in a test is the assertion.
  'rm3-node/no-unguarded-json-parse': 'off',
  // The base list, plus: a wall-clock sleep is the classic flaky test
  // (flaky-tests.md). Wait for the condition or use `t.mock.timers`.
  'no-restricted-imports': [
    'error',
    {
      paths: [
        ...restrictedImportPaths,
        {
          importNames: ['setTimeout'],
          message: 'Wait for the condition or use t.mock.timers; a fixed sleep is a flaky test.',
          name: 'node:timers/promises',
        },
      ],
    },
  ],
} satisfies NonNullable<OxlintConfig['rules']>;

/**
 * The two `rm3-tailwind` plugin rules, the Tailwind practices a linter can
 * check from class strings alone. On for every file: they match `className` and
 * `cn`/`cva` calls, so a Node file pays nothing. Neither rule has an oxlint
 * counterpart.
 */
export const tailwindRulesOn = {
  // No arbitrary values (`bg-[#fff]`, `p-[13px]`) outside the height and
  // width utilities; tokens live in `@theme`. Widen the allowlist in a
  // consumer override with `['error', { allow: ['grid-cols-'] }]`.
  'rm3-tailwind/no-arbitrary-values': tailwindCustomRules['rm3-tailwind/no-arbitrary-values'],
  // `bg-${color}-600` is never emitted; Tailwind only generates classes it
  // finds whole in source.
  'rm3-tailwind/no-dynamic-class-names': tailwindCustomRules['rm3-tailwind/no-dynamic-class-names'],
} satisfies NonNullable<OxlintConfig['rules']>;

/**
 * The twenty-one `rm3-shadcn` plugin rules, each a practice from the global
 * `shadcn` skill's `rules/*.md` a linter can check from JSX and class
 * strings. On for
 * every file: they match `className`, the class helpers and shadcn component
 * names, so a Node file pays nothing. None has an oxlint counterpart.
 */
export const shadcnRulesOn = {
  // base-vs-radix.md: `asChild`, `SelectContent position`, `ToggleGroup
  // type` on a Base UI project (or `render`, `multiple` on Radix). A Radix
  // project sets `['error', { base: 'radix' }]`.
  'rm3-shadcn/no-base-api-mismatch': shadcnCustomRules['rm3-shadcn/no-base-api-mismatch'],
  // composition.md: `isLoading` / `isPending` on `Button`; `Spinner` with
  // `data-icon` and `disabled` instead.
  'rm3-shadcn/no-button-loading-prop': shadcnCustomRules['rm3-shadcn/no-button-loading-prop'],
  // styling.md: `${a ? b : c}` in a className template; `cn()` takes the condition.
  'rm3-shadcn/no-conditional-class-template':
    shadcnCustomRules['rm3-shadcn/no-conditional-class-template'],
  // styling.md: `dark:bg-gray-950` picks a color the semantic token already
  // decides. Palette values only; `['error', { strict: true }]` also reports
  // a `dark:` on a semantic token.
  'rm3-shadcn/no-dark-color-overrides': shadcnCustomRules['rm3-shadcn/no-dark-color-overrides'],
  // icons.md: `size-4` on an icon inside `Button`, `DropdownMenuItem`,
  // `Alert`, `Sidebar*`; the component sizes its icons. Tabler projects add
  // `['error', { iconPrefixes: ['Icon'] }]`.
  'rm3-shadcn/no-icon-size-classes': shadcnCustomRules['rm3-shadcn/no-icon-size-classes'],
  // styling.md: `z-50` on `DialogContent`, `PopoverContent` and the other
  // overlay surfaces; the primitives stack themselves.
  'rm3-shadcn/no-overlay-z-index': shadcnCustomRules['rm3-shadcn/no-overlay-z-index'],
  // styling.md: `bg-blue-500`, `text-gray-600`, `text-white`; semantic tokens
  // only. Widen with `['error', { allow: ['white'] }]`.
  'rm3-shadcn/no-palette-colors': shadcnCustomRules['rm3-shadcn/no-palette-colors'],
  // forms.md: a `relative` wrapper with an `absolute` button or icon over an
  // `Input`; `InputGroup` + `InputGroupAddon`.
  'rm3-shadcn/no-positioned-input-addon': shadcnCustomRules['rm3-shadcn/no-positioned-input-addon'],
  // forms.md: `Input` / `Textarea` inside `InputGroup`.
  'rm3-shadcn/no-raw-input-in-input-group':
    shadcnCustomRules['rm3-shadcn/no-raw-input-in-input-group'],
  // styling.md: `space-y-4`; `flex flex-col gap-4`.
  'rm3-shadcn/no-space-utilities': shadcnCustomRules['rm3-shadcn/no-space-utilities'],
  // composition.md: `SelectItem` directly in `SelectContent`, `TabsTrigger`
  // directly in `Tabs`; items live in their Group.
  'rm3-shadcn/no-ungrouped-items': shadcnCustomRules['rm3-shadcn/no-ungrouped-items'],
  // base-vs-radix.md: a `div` / `span` between a trigger and its one child.
  'rm3-shadcn/no-wrapped-trigger': shadcnCustomRules['rm3-shadcn/no-wrapped-trigger'],
  // chat.md: `Separator` + label + `Separator`; `Marker`.
  'rm3-shadcn/prefer-marker': shadcnCustomRules['rm3-shadcn/prefer-marker'],
  // composition.md: `<hr>` or an empty `border-t` div; `Separator`.
  'rm3-shadcn/prefer-separator': shadcnCustomRules['rm3-shadcn/prefer-separator'],
  // styling.md: `w-10 h-10` in one string; `size-10`.
  'rm3-shadcn/prefer-size-utility': shadcnCustomRules['rm3-shadcn/prefer-size-utility'],
  // composition.md: `animate-pulse` on a `div`; `Skeleton`.
  'rm3-shadcn/prefer-skeleton': shadcnCustomRules['rm3-shadcn/prefer-skeleton'],
  // styling.md: `overflow-hidden text-ellipsis whitespace-nowrap`; `truncate`.
  'rm3-shadcn/prefer-truncate': shadcnCustomRules['rm3-shadcn/prefer-truncate'],
  // forms.md: `data-invalid` on `Field` pairs with `aria-invalid` on the
  // control, `data-disabled` with `disabled`.
  'rm3-shadcn/require-field-state-pairing':
    shadcnCustomRules['rm3-shadcn/require-field-state-pairing'],
  // icons.md: an icon beside text in `Button` carries `data-icon`.
  'rm3-shadcn/require-icon-data-icon': shadcnCustomRules['rm3-shadcn/require-icon-data-icon'],
  // base-vs-radix.md: `render={<a />}` on a button primitive needs
  // `nativeButton={false}`.
  'rm3-shadcn/require-native-button-false':
    shadcnCustomRules['rm3-shadcn/require-native-button-false'],
  // composition.md: `DialogContent` / `SheetContent` / `DrawerContent` /
  // `AlertDialogContent` need a Title; `Avatar` needs `AvatarFallback`.
  'rm3-shadcn/require-parts': shadcnCustomRules['rm3-shadcn/require-parts'],
} satisfies NonNullable<OxlintConfig['rules']>;

/**
 * The five `rm3-fastify` plugin rules, each a practice from the
 * `fastify-best-practices` or `logging-best-practices` skill a linter can
 * decide from the call shape. On for every file: they key on `addHook`,
 * `fp()`, the `fastify` import and the handler signature, so a file without
 * Fastify pays nothing. None has an oxlint counterpart.
 */
export const fastifyRulesOn = {
  // hooks.md: hooks are async; the `done` form is legacy, and an async hook
  // that also takes `done` runs the chain twice.
  'rm3-fastify/no-callback-hooks': fastifyCustomRules['rm3-fastify/no-callback-hooks'],
  // logging-best-practices wide-events.md / pitfalls.md: one wide event per
  // request; Fastify's `incoming request` / `request completed` pair is noise.
  'rm3-fastify/no-default-request-logging':
    fastifyCustomRules['rm3-fastify/no-default-request-logging'],
  // logging-best-practices wide-events.md: `genReqId: () => randomUUID()`; the
  // default counter restarts at 1 per process, so `reqId` cannot be joined.
  'rm3-fastify/require-gen-req-id': fastifyCustomRules['rm3-fastify/require-gen-req-id'],
  // plugins.md: `dependencies` resolve by name, so every `fp()` carries one.
  'rm3-fastify/require-plugin-name': fastifyCustomRules['rm3-fastify/require-plugin-name'],
  // routes.md / hooks.md: `return reply.send(...)` (or `await`) in an async
  // handler or hook, so the chain stops when the response goes out.
  'rm3-fastify/return-reply': fastifyCustomRules['rm3-fastify/return-reply'],
} satisfies NonNullable<OxlintConfig['rules']>;

/**
 * Rules to turn off over vendored shadcn primitives. These are generated by
 * `shadcn add` and re-generated on upgrade, so no rule here may force an edit
 * that the next regeneration deletes — every style rule upstream trips is off.
 * Correctness and type-aware rules stay on, so a real bug still reports.
 */
export const shadcnRulesOff = {
  // Regenerated by `shadcn add`; SAFETY comments would not survive.
  ...antiSlopRulesOff,
  'import/no-namespace': 'off',
  // These a11y rules are about the wrapper markup Base UI expects
  // (`role="group"` on an input group, `role="link"` on a breadcrumb),
  // which the primitives already handle correctly underneath.
  'jsx-a11y/click-events-have-key-events': 'off',
  'jsx-a11y/no-noninteractive-element-interactions': 'off',
  'jsx-a11y/prefer-tag-over-role': 'off',
  // Style rules upstream shadcn does not follow. Each one would force an
  // edit that the next `shadcn add` overwrites.
  curly: 'off',
  eqeqeq: 'off',
  'react/no-array-index-key': 'off',
  // shadcn `Button` omits `type` by design.
  'react/button-has-type': 'off',
  // shadcn `sidebar.tsx` names its `useState` pairs `[_open, _setOpen]`.
  'react/hook-use-state': 'off',
  // Upstream `chart.tsx` uses separate filter/map passes.
  'react-doctor/js-combine-iterations': 'off',
  // Upstream `chart.tsx` imports recharts directly.
  'react-doctor/prefer-dynamic-import': 'off',
  // Upstream `chart.tsx` memoizes before its early return.
  'react-doctor/rerender-memo-before-early-return': 'off',
  // Upstream `progress.tsx` uses transition-all.
  'react-doctor/no-transition-all': 'off',
  // Vendored `sidebar.tsx` reads a browser global during render.
  'react-doctor/no-hydration-branch-on-browser-global': 'off',
  'typescript/array-type': 'off',
  // Hundreds of hits across the primitives. The prop and key order is upstream's.
  'perfectionist/sort-enums': 'off',
  'perfectionist/sort-heritage-clauses': 'off',
  'perfectionist/sort-interfaces': 'off',
  'perfectionist/sort-jsx-props': 'off',
  'perfectionist/sort-object-types': 'off',
  'perfectionist/sort-objects': 'off',
  // Upstream primitives use `rounded-[...]`, `transition-[...]`,
  // `[&_svg]:size-[...]`, and a few build class names from props.
  'rm3-tailwind/no-arbitrary-values': 'off',
  'rm3-tailwind/no-dynamic-class-names': 'off',
  // Upstream primitives use `dark:` palette variants, `space-*`, sized `svg`
  // selectors, `z-50` on their own overlays, and compose their own parts.
  // Every rm3-shadcn rule describes app code composing the primitives, not
  // the primitives themselves.
  'rm3-shadcn/no-base-api-mismatch': 'off',
  'rm3-shadcn/no-button-loading-prop': 'off',
  'rm3-shadcn/no-conditional-class-template': 'off',
  'rm3-shadcn/no-dark-color-overrides': 'off',
  'rm3-shadcn/no-icon-size-classes': 'off',
  'rm3-shadcn/no-overlay-z-index': 'off',
  'rm3-shadcn/no-palette-colors': 'off',
  'rm3-shadcn/no-positioned-input-addon': 'off',
  'rm3-shadcn/no-raw-input-in-input-group': 'off',
  'rm3-shadcn/no-space-utilities': 'off',
  'rm3-shadcn/no-ungrouped-items': 'off',
  'rm3-shadcn/no-wrapped-trigger': 'off',
  'rm3-shadcn/prefer-marker': 'off',
  'rm3-shadcn/prefer-separator': 'off',
  'rm3-shadcn/prefer-size-utility': 'off',
  'rm3-shadcn/prefer-skeleton': 'off',
  'rm3-shadcn/prefer-truncate': 'off',
  'rm3-shadcn/require-field-state-pairing': 'off',
  'rm3-shadcn/require-icon-data-icon': 'off',
  'rm3-shadcn/require-native-button-false': 'off',
  'rm3-shadcn/require-parts': 'off',
} satisfies NonNullable<OxlintConfig['rules']>;

export const rm3Config: OxlintConfig = {
  categories: {
    // Code that is outright wrong or useless
    correctness: 'error',
    // Code that is most likely wrong or useless
    suspicious: 'error',
    // Strict rules with occasional false positives
    pedantic: 'warn',
    // Rules that aim to improve runtime performance
    perf: 'warn',
    // `style` is off: oxfmt owns formatting, and the rest of the category
    // (sort-keys, no-ternary, import/no-named-export) is preference that
    // produced ~1,300 warnings in the repo this came from. `curly` was the one
    // worth having, so it is opted into individually below.
    // `restriction` is off: feature ban-lists; the few we want are opted into
    // individually below.
    // `nursery` is off: unstable by definition, so it breaks lint on upgrade.
  },
  // builtin + es2024 only; a consumer adds `node`, `browser` or `serviceworker`
  // itself, because the right answer differs per repo and per directory.
  env: {
    builtin: true,
    es2024: true,
  },
  jsPlugins: [
    // `import.meta.resolve` runs HERE, inside rm3-shared, so the specifiers
    // resolve from rm3-shared/node_modules even when a consumer reaches this
    // file through a `link:` symlink.
    {
      name: 'perfectionist',
      specifier: import.meta.resolve('eslint-plugin-perfectionist'),
    },
    // Vendored anti-slop rules. Source-only package, loaded straight from .ts.
    {
      name: 'anti-slop',
      specifier: import.meta.resolve('@rm3/lint'),
    },
    rm3NodeJsPlugin,
    rm3TailwindJsPlugin,
    rm3ShadcnJsPlugin,
    rm3FastifyJsPlugin,
    reactDoctorJsPlugin,
  ],
  options: {
    // tsgolint type-aware rules, plus TypeScript compiler diagnostics. Both are
    // on here so a plain `pnpm lint` is the full check; CLI flags still take
    // precedence over this file.
    typeAware: true,
    typeCheck: true,
  },
  overrides: [
    {
      // Cyclomatic complexity counts every `&&` and ternary as a branch. In a
      // render body those are a display ladder, not control flow: a component
      // that shows one of four states scores the same as a four-way algorithm.
      // The rule measures the wrong thing here, so it is off for markup and
      // stays on for the `.ts` logic those components call.
      files: ['**/*.tsx'],
      rules: {
        complexity: 'off',
        // `ignoreVoid: false` is a Node decision (see `nodeRulesOn`). In a
        // component, `void mutate()` in an event handler is the idiom, and
        // TanStack mutations route rejections to `onError`; the default
        // (`void` allowed) is right for markup.
        'typescript/no-floating-promises': 'error',
        // Matches any `*Sync` call by name, so react-dom's `flushSync` trips
        // it. No component does filesystem I/O.
        'node/no-sync': 'off',
      },
    },
    {
      // Build tooling reads untyped JSON and third-party config types.
      files: ['*.config.ts'],
      rules: {
        'typescript/no-unsafe-assignment': 'off',
        'typescript/no-unsafe-member-access': 'off',
        // e.g. Vite's rollupOptions -> rolldownOptions
        'typescript/no-deprecated': 'off',
      },
    },
    {
      // `node:test` returns a promise from `describe` and `test` that the
      // runner itself awaits — the whole API is built on not awaiting them at
      // the call site. Tests sit next to the module they cover, so match by
      // suffix rather than by directory.
      files: ['**/*.test.ts'],
      rules: {
        'typescript/no-floating-promises': 'off',
        // Tests set and swap environment variables directly. That is exactly
        // what a lazy env reader exists to serve.
        'node/no-process-env': 'off',
        ...nodeTestRulesOff,
      },
    },
  ],
  // React is on for every file: react, react-perf and jsx-a11y rules only
  // match JSX and hook calls, so a Node file pays nothing.
  // An explicit list REPLACES oxlint's defaults, so `typescript`, `unicorn`,
  // and `oxc` must be named here or they are silently dropped — and with
  // `typescript` gone, every type-aware rule stops running.
  plugins: ['typescript', 'unicorn', 'oxc', 'import', 'node', 'promise', ...reactPlugins],
  rules: {
    // Would require readonly-wrapping nearly every React prop and Node option
    // object. Many hits, none of them bugs.
    'typescript/prefer-readonly-parameter-types': 'off',
    // Fights idiomatic `if (str)` / `if (arr.length)`.
    'typescript/strict-boolean-expressions': 'off',
    // Fights `onClick={() => doThing()}`, the standard React handler shape.
    'typescript/no-confusing-void-expression': 'off',
    // Assertions are a deliberate escape hatch at schema boundaries.
    'typescript/no-unsafe-type-assertion': 'off',
    // Trusts the declared types over runtime reality, which is backwards for
    // this kind of code: the guards it flags sit on host APIs that are absent
    // in some environments, on JSON read back off disk, and on index lookups.
    // Deleting them is how code starts throwing in the environments the types
    // don't describe.
    'typescript/no-unnecessary-condition': 'off',
    // Fastify hooks return `reply` to signal "response already sent" and
    // nothing to continue; React effects return a cleanup or nothing. Both
    // contracts are mixed-return by design.
    'typescript/consistent-return': 'off',

    // --- Type-aware rules worth having ---
    'typescript/consistent-type-exports': 'warn',
    'typescript/dot-notation': 'warn',
    // `void promise` is not an escape hatch: a rejected warm-up task would
    // reach `unhandledRejection` and close-with-grace would take the process
    // down. Fire-and-forget ends in `.catch` or is awaited.
    'typescript/no-floating-promises': ['error', { ignoreVoid: false }],
    'typescript/no-misused-promises': 'error',
    'typescript/no-unnecessary-qualifier': 'warn',
    'typescript/no-unnecessary-type-conversion': 'warn',
    'typescript/no-unnecessary-type-parameters': 'warn',
    'typescript/no-useless-default-assignment': 'warn',
    'typescript/prefer-find': 'warn',
    // `||` on a string is almost always a deliberate empty-string fallback
    // (`tab.title || tab.url`), which `??` would not preserve.
    'typescript/prefer-nullish-coalescing': ['warn', { ignorePrimitives: { string: true } }],
    'typescript/prefer-optional-chain': 'warn',
    'typescript/prefer-readonly': 'warn',
    'typescript/prefer-regexp-exec': 'warn',
    'typescript/prefer-string-starts-ends-with': 'warn',
    'typescript/strict-void-return': 'warn',
    // Catches union members dropped from a switch that has no fallback. A
    // `default` arm is treated as covering the rest on purpose: one deliberate
    // fallback beats nine hand-written cases that say the same thing.
    'typescript/switch-exhaustiveness-check': [
      'error',
      { considerDefaultExhaustiveForUnions: true },
    ],

    // --- Suppressions that still fire under the narrowed categories ---
    // No correctness value for the patterns they match.
    'max-lines': 'off',
    'max-lines-per-function': 'off',
    'require-unicode-regexp': 'off',
    // Handlers and hooks are async by contract even when a given one has
    // nothing to await; oRPC and Fastify both expect a promise back.
    'require-await': 'off',
    'typescript/require-await': 'off',
    // The redundant arm it flags (`case '{slug}': default:`) is there to spell
    // out the full set of supported patterns next to the fallback.
    'unicorn/no-useless-switch-case': 'off',
    // Guards against `['1','2'].map(Number)`-style arity surprises, which
    // TypeScript already rejects; in practice it only fires on
    // single-argument helpers that are safe by signature.
    'unicorn/no-array-callback-reference': 'off',
    // Filesystem and git work is deliberately sequential. Parallelizing it
    // would reorder commits, race on the index, and exhaust descriptors on
    // a large repo.
    'no-await-in-loop': 'off',
    // Wiring modules and composed pages legitimately pull in many
    // collaborators; the count says nothing useful about coupling.
    'import/max-dependencies': 'off',
    // CSS side-effect imports are standard.
    'import/no-unassigned-import': 'off',
    'promise/always-return': 'off',
    'promise/catch-or-return': 'off',
    // Matches on the method name alone, so it also fires on
    // `BroadcastChannel.postMessage` and `chrome.runtime.Port.postMessage`,
    // neither of which takes a `targetOrigin` — passing one is a type error.
    'unicorn/require-post-message-target-origin': 'off',

    // --- Opt-ins from restriction/style/nursery ---
    // These categories are off wholesale, so each rule below is named
    // individually. They are ratchets that keep an existing discipline from
    // eroding rather than cleanups.
    // Escape hatches that should never become the default.
    'no-empty': 'error',
    'no-var': 'error',
    'typescript/no-empty-object-type': 'error',
    'typescript/no-explicit-any': 'error',
    'typescript/no-require-imports': 'error',
    // A blanket `oxlint-disable` silences every future rule too; force the
    // suppression to name what it is suppressing.
    'unicorn/no-abusive-eslint-disable': 'error',
    // `&`/`|` where `&&`/`||` was meant.
    'oxc/bad-bitwise-operator': 'error',
    // A cap on branching, not on size — `max-lines-per-function` is off above
    // because length says nothing useful, while twenty decision points in one
    // function is where a missed case hides. Off for `.tsx` in the override
    // below, where the count measures markup instead.
    // --- complexity family (shared package) ---
    ...complexityRules,
    // --- anti-slop (JS plugin, shared package) ---
    ...antiSlopRules,
    'prefer-arrow-callback': ['error', { allowNamedFunctions: true }],
    'prefer-const': 'error',
    'prefer-object-has-own': 'error',
    // Nursery, so an oxlint upgrade can change what they report. Both are set
    // at a level that will not break `main` if they get noisier.
    'import/export': 'error',
    'no-useless-assignment': 'warn',
    // Console output is a logger's job; a consumer scopes exceptions away in
    // its own override.
    'no-console': 'error',
    // Keeps an undocumented `process.env.X ?? ''` from appearing in a router.
    // A repo reads and types every variable in one env module, which turns
    // this rule off for itself with a named per-line disable.
    'node/no-process-env': 'error',
    // Brace-less single-statement bodies are where the "someone adds a second
    // statement" bug lives. Autofixable, so the cost is one commit.
    curly: 'error',
    // One name for the caught thing, everywhere.
    'object-shorthand': 'error',
    // `cause` is anti-slop's one allowed name for an unknown error parameter.
    'unicorn/catch-error-name': ['error', { ignore: ['^cause$'] }],
    // `T[]` over `Array<T>`.
    'typescript/array-type': ['error', { default: 'array' }],
    // --- perfectionist (JS plugin) ---
    // `partitionByComment` is load-bearing. Settings and config objects get
    // grouped under `// Appearance`-style headers; without partitioning,
    // sorting scatters each group and orphans every header comment.
    'perfectionist/sort-enums': ['warn', { partitionByComment: true, sortByValue: 'always' }],
    'perfectionist/sort-heritage-clauses': 'warn',
    'perfectionist/sort-interfaces': ['warn', { partitionByComment: true }],
    'perfectionist/sort-object-types': ['warn', { partitionByComment: true }],
    'perfectionist/sort-objects': ['warn', { partitionByComment: true }],
    // Plain alphabetical would wedge `className` between `aria-*` and `onClick`
    // on every element and split handlers from the props they act on. Grouping
    // keeps the semantic order the JSX already has and sorts within it.
    'perfectionist/sort-jsx-props': [
      'warn',
      {
        customGroups: [{ elementNamePattern: '^on[A-Z]', groupName: 'callback' }],
        groups: ['shorthand-prop', 'multiline-prop', 'unknown', 'callback'],
      },
    ],
    // `import * as X` in vendored code is exempted by `shadcnRulesOff`. This
    // guards hand-written code.
    'import/no-namespace': 'error',

    // --- Pedantic rules promoted to error ---
    // Already warnings via the category. These two encode a decision rather
    // than a preference, so a warning undersells them.
    // `{ null: 'ignore' }` keeps `x == null` as the null-or-undefined check.
    eqeqeq: ['error', 'always', { null: 'ignore' }],
    'no-throw-literal': 'error',

    // --- React and react-doctor (on for every file) ---
    ...reactRules,
    ...reactDoctorRules,

    // --- Node (on for every file; the rules match Node APIs and imports) ---
    ...nodeRules,
    // --- Tailwind ---
    ...tailwindRulesOn,
    // --- shadcn (from the global shadcn skill's rules) ---
    ...shadcnRulesOn,
    // --- Fastify (fastify-best-practices skill) ---
    ...fastifyRulesOn,
  },
};

export default rm3Config;
