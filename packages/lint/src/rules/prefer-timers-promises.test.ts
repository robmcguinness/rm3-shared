import { RuleTester } from 'oxlint/plugins-dev';

import { preferTimersPromisesRule } from './prefer-timers-promises.ts';

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: 'ts' } } });
const error = { messageId: 'preferTimersPromises' };

tester.run('rm3-node/prefer-timers-promises', preferTimersPromisesRule, {
  invalid: [
    { code: 'await new Promise((resolve) => setTimeout(resolve, 100));', errors: [error] },
    { code: 'await new Promise((r) => setTimeout(r, 100));', errors: [error] },
    { code: 'await new Promise<void>((resolve) => setTimeout(resolve, 100));', errors: [error] },
    { code: 'await new Promise((resolve) => { setTimeout(resolve, 100); });', errors: [error] },
    {
      code: 'await new Promise((resolve) => { return setTimeout(resolve, 100); });',
      errors: [error],
    },
    {
      code: 'await new Promise(function (resolve) { setTimeout(resolve, 100); });',
      errors: [error],
    },
    { code: 'await new Promise((resolve) => setImmediate(resolve));', errors: [error] },
    { code: 'await new Promise((resolve, reject) => setTimeout(resolve, 5));', errors: [error] },
  ],
  valid: [
    "import { setTimeout } from 'node:timers/promises'; await setTimeout(100);",
    // Resolves with a value computed in the callback, not the bare resolve.
    'await new Promise((resolve) => setTimeout(() => resolve(1), 100));',
    // Resolves something other than a timer.
    "await new Promise((resolve) => socket.once('close', resolve));",
    // More than one statement: the timer is only part of the executor.
    'await new Promise((resolve) => { const id = setTimeout(resolve, 100); id.unref(); });',
    // Shadowed timer or Promise binding.
    'function wrap(setTimeout: (cb: () => void) => void) { return new Promise((resolve) => setTimeout(resolve)); }',
    'const Promise = { resolve() {} }; new Promise((resolve) => setTimeout(resolve, 1));',
    'new Promise((resolve) => clearTimeout(resolve));',
  ],
});
