import { eslintCompatPlugin } from '@oxlint/plugins';

import { noChainedTypeAssertionsRule } from './rules/no-chained-type-assertions.ts';
import { noConditionalEmptyObjectSpreadRule } from './rules/no-conditional-empty-object-spread.ts';
import { noKnownValueWideningRule } from './rules/no-known-value-widening.ts';
import { noModuleMockingRule } from './rules/no-module-mocking.ts';
import { noObjectParametersRule } from './rules/no-object-parameters.ts';
import { noReflectApplyRule } from './rules/no-reflect-apply.ts';
import { noReflectGetRule } from './rules/no-reflect-get.ts';
import { noRuntimeTypeofRule } from './rules/no-runtime-typeof.ts';
import { noForbiddenTermInSymbolNamesRule } from './rules/no-shape-in-symbol-names.ts';
import { noUnknownParametersRule } from './rules/no-unknown-parameters.ts';
import { noUnknownReturnsRule } from './rules/no-unknown-returns.ts';
import { noUnknownTypeAliasesRule } from './rules/no-unknown-type-aliases.ts';
import { noUnsafeDictionaryTypeRule } from './rules/no-unsafe-dictionary-type.ts';
import { noWidenThenAssertRule } from './rules/no-widen-then-assert.ts';
import { requireSafetyCommentForTypeAssertionRule } from './rules/require-safety-comment-for-type-assertion.ts';

/** Generic Oxlint rules that reject low-evidence and low-signal implementation patterns. */
const antiSlopPlugin = eslintCompatPlugin({
  meta: { name: 'anti-slop' },
  rules: {
    'no-chained-type-assertions': noChainedTypeAssertionsRule,
    'no-conditional-empty-object-spread': noConditionalEmptyObjectSpreadRule,
    'no-known-value-widening': noKnownValueWideningRule,
    'no-module-mocking': noModuleMockingRule,
    'no-object-parameters': noObjectParametersRule,
    'no-reflect-apply': noReflectApplyRule,
    'no-reflect-get': noReflectGetRule,
    'no-runtime-typeof': noRuntimeTypeofRule,
    'no-shape-in-symbol-names': noForbiddenTermInSymbolNamesRule,
    'no-unknown-parameters': noUnknownParametersRule,
    'no-unknown-returns': noUnknownReturnsRule,
    'no-unknown-type-aliases': noUnknownTypeAliasesRule,
    'no-unsafe-dictionary-type': noUnsafeDictionaryTypeRule,
    'no-widen-then-assert': noWidenThenAssertRule,
    'require-safety-comment-for-type-assertion': requireSafetyCommentForTypeAssertionRule,
  },
});

export default antiSlopPlugin;

// A variable type annotation (not a cast, so no assertion for require-safety-
// comment-for-type-assertion to flag) keeps every value narrow while staying
// a mutable tuple: oxlint's own `Config['rules']` shape rejects the `readonly`
// tuples `as const` would produce for the two options-carrying rules below.
export const antiSlopRules: {
  'anti-slop/no-chained-type-assertions': 'error';
  'anti-slop/no-conditional-empty-object-spread': 'error';
  'anti-slop/no-known-value-widening': 'error';
  'anti-slop/no-module-mocking': 'error';
  'anti-slop/no-object-parameters': 'error';
  'anti-slop/no-reflect-apply': 'error';
  'anti-slop/no-reflect-get': 'error';
  'anti-slop/no-runtime-typeof': ['error', { allowInTypeGuards: boolean }];
  'anti-slop/no-shape-in-symbol-names': 'error';
  'anti-slop/no-unknown-parameters': 'error';
  'anti-slop/no-unknown-returns': 'error';
  'anti-slop/no-unknown-type-aliases': 'error';
  'anti-slop/no-unsafe-dictionary-type': 'error';
  'anti-slop/no-widen-then-assert': 'error';
  'anti-slop/require-safety-comment-for-type-assertion': ['error', { markers: string[] }];
} = {
  'anti-slop/no-chained-type-assertions': 'error',
  'anti-slop/no-conditional-empty-object-spread': 'error',
  'anti-slop/no-known-value-widening': 'error',
  'anti-slop/no-module-mocking': 'error',
  'anti-slop/no-object-parameters': 'error',
  'anti-slop/no-reflect-apply': 'error',
  'anti-slop/no-reflect-get': 'error',
  // allowInTypeGuards: structural probes of NodeJS.ErrnoException / net.AddressInfo / chrome.*
  // have no schema; a typed guard is the rule's documented escape.
  'anti-slop/no-runtime-typeof': ['error', { allowInTypeGuards: true }],
  'anti-slop/no-shape-in-symbol-names': 'error',
  'anti-slop/no-unknown-parameters': 'error',
  'anti-slop/no-unknown-returns': 'error',
  'anti-slop/no-unknown-type-aliases': 'error',
  'anti-slop/no-unsafe-dictionary-type': 'error',
  'anti-slop/no-widen-then-assert': 'error',
  'anti-slop/require-safety-comment-for-type-assertion': ['error', { markers: ['SAFETY'] }],
};

// A variable type annotation (not a cast) so the tuples stay mutable: oxlint's
// own `Config['rules']` shape wants `['error', { max: number }]`, not the
// `readonly` tuple `as const` would produce for these two overlapping keys.
export const complexityRules: {
  complexity: ['error', { max: number }];
  'max-depth': ['warn', { max: number }];
  'max-nested-callbacks': ['warn', { max: number }];
  'max-params': ['warn', { max: number }];
} = {
  complexity: ['error', { max: 20 }],
  'max-depth': ['warn', { max: 4 }],
  // describe > it > assert.rejects(cb) > .map is 4 today
  'max-nested-callbacks': ['warn', { max: 5 }],
  // CommandError(command, code, stderr, cause) is the widest today
  'max-params': ['warn', { max: 4 }],
};

/** Same keys, all 'off'. For the plugin's own source, where typeof on an AST is the job. */
export const antiSlopRulesOff = Object.fromEntries(
  Object.keys(antiSlopRules).map((key) => [key, 'off'] as const),
);
