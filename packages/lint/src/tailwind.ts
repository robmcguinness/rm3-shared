import { eslintCompatPlugin } from '@oxlint/plugins';

import { noArbitraryValuesRule } from './rules/no-arbitrary-values.ts';
import { noDynamicClassNamesRule } from './rules/no-dynamic-class-names.ts';

/**
 * Tailwind rules for the two practices a linter can check from class strings
 * alone. A separate plugin from `anti-slop` so `antiSlopRulesOff` (vendored shadcn,
 * the plugin's own source) leaves these on; `shadcnRulesOff` turns them off
 * by name instead.
 */
const rm3TailwindPlugin = eslintCompatPlugin({
  meta: { name: 'rm3-tailwind' },
  rules: {
    'no-arbitrary-values': noArbitraryValuesRule,
    'no-dynamic-class-names': noDynamicClassNamesRule,
  },
});

export default rm3TailwindPlugin;

// A variable type annotation (not a cast) for the same reason as
// `antiSlopRules`: every value stays the literal `'error'` while the object
// remains the mutable shape oxlint's `Config['rules']` accepts.
export const tailwindCustomRules: {
  'rm3-tailwind/no-arbitrary-values': 'error';
  'rm3-tailwind/no-dynamic-class-names': 'error';
} = {
  // Tokens live in `@theme`; height and width pass through the rule's default `allow`. A consumer widens it
  // with `['error', { allow: [...] }]` in its own override.
  'rm3-tailwind/no-arbitrary-values': 'error',
  // Tailwind only emits classes it finds whole in source.
  'rm3-tailwind/no-dynamic-class-names': 'error',
};
