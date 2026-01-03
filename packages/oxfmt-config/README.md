# @rm3/oxfmt-config

The shared oxfmt formatting options for rm3 repos. Peer tool: `oxfmt@^0.65.0`.

Like `@rm3/oxlint-config`, this exports a plain object rather than a `defineConfig` call, so the
consumer's own oxfmt does the defining.

## Exports

`rm3Fmt` (also `default`): `endOfLine: 'lf'`, `jsxSingleQuote: true`, `printWidth: 100`,
`semi: true`, `singleQuote: true`, and `ignorePatterns: ['dist', 'build', 'node_modules', '.vite',
'pnpm-lock.yaml']`.

## How a consumer extends it

oxfmt has **no `extends`**. Spread the object, and concatenate onto `ignorePatterns` rather than
replacing it:

```ts
// oxfmt.config.ts
import { defineConfig } from 'oxfmt';
import { rm3Fmt } from '@rm3/oxfmt-config';

export default defineConfig({
    ...rm3Fmt,
    ignorePatterns: [...rm3Fmt.ignorePatterns, 'apps/daemon/daemon.schema.json'],
});
```
