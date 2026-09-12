import { eslintCompatPlugin } from '@oxlint/plugins';

import { noManualSignalHandlersRule } from './rules/no-manual-signal-handlers.ts';
import { noUnguardedJsonParseRule } from './rules/no-unguarded-json-parse.ts';
import { preferTimersPromisesRule } from './rules/prefer-timers-promises.ts';

/**
 * Node runtime rules for patterns oxlint has no built-in rule for. A separate
 * plugin from `anti-slop` so `antiSlopRulesOff` (vendored shadcn, the plugin's
 * own source) leaves these on.
 */
const rm3NodePlugin = eslintCompatPlugin({
  meta: { name: 'rm3-node' },
  rules: {
    'no-manual-signal-handlers': noManualSignalHandlersRule,
    'no-unguarded-json-parse': noUnguardedJsonParseRule,
    'prefer-timers-promises': preferTimersPromisesRule,
  },
});

export default rm3NodePlugin;

// A variable type annotation (not a cast) for the same reason as
// `antiSlopRules`: every value stays the literal `'error'` while the object
// remains the mutable shape oxlint's `Config['rules']` accepts.
export const nodeCustomRules: {
  'rm3-node/no-manual-signal-handlers': 'error';
  'rm3-node/no-unguarded-json-parse': 'error';
  'rm3-node/prefer-timers-promises': 'error';
} = {
  // close-with-grace owns SIGTERM/SIGINT/uncaughtException/unhandledRejection.
  'rm3-node/no-manual-signal-handlers': 'error',
  // A zod `safeParse` on the result does not catch the SyntaxError.
  'rm3-node/no-unguarded-json-parse': 'error',
  // `node:timers/promises` already returns a promise and takes a signal.
  'rm3-node/prefer-timers-promises': 'error',
};
