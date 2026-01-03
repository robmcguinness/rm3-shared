// Type-only import: erased at runtime, so importing this module never binds
// rm3-shared's copy of oxfmt into a consumer's process. `defineConfig` is
// deliberately never CALLED here — the consumer calls it on its own oxfmt.
import type { OxfmtConfig } from 'oxfmt';

/**
 * Shared oxfmt options. oxfmt has no `extends`, so a consumer spreads this
 * object into its own `defineConfig` call and appends to `ignorePatterns`.
 *
 * `satisfies` rather than a type annotation: every field on `OxfmtConfig` is
 * optional, so annotating would widen `ignorePatterns` to `string[] |
 * undefined` and break the documented `[...rm3Fmt.ignorePatterns, 'extra']`
 * recipe under `strict`. `satisfies` still checks the object against the type.
 */
export const rm3Fmt = {
  endOfLine: 'lf',
  ignorePatterns: ['dist', 'build', 'node_modules', '.vite', 'pnpm-lock.yaml'],
  jsxSingleQuote: true,
  printWidth: 100,
  semi: true,
  singleQuote: true,
} satisfies OxfmtConfig;

export default rm3Fmt;
