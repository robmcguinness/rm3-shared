import { RuleTester } from 'oxlint/plugins-dev';

import { noManualSignalHandlersRule } from './no-manual-signal-handlers.ts';

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: 'ts' } } });
const error = { messageId: 'manualSignalHandler' };

tester.run('rm3-node/no-manual-signal-handlers', noManualSignalHandlersRule, {
  invalid: [
    { code: "process.on('SIGTERM', shutdown);", errors: [error] },
    { code: "process.on('SIGINT', () => shutdown('SIGINT'));", errors: [error] },
    { code: "process.once('SIGHUP', reload);", errors: [error] },
    { code: "process.on('uncaughtException', crash);", errors: [error] },
    { code: "process.on('unhandledRejection', crash);", errors: [error] },
    { code: "process.addListener('SIGTERM', shutdown);", errors: [error] },
    { code: "process.prependListener('SIGTERM', shutdown);", errors: [error] },
    { code: "process['on']('SIGTERM', shutdown);", errors: [error] },
    { code: 'process.on(`SIGTERM`, shutdown);', errors: [error] },
    {
      code: "import process from 'node:process'; process.on('SIGTERM', shutdown);",
      errors: [error],
    },
    {
      code: "import { process } from 'node:process'; process.on('SIGTERM', shutdown);",
      errors: [error],
    },
    { code: "import proc from 'node:process'; proc.on('SIGINT', shutdown);", errors: [error] },
    {
      code: "for (const signal of ['SIGTERM', 'SIGINT'] as const) { process.on('SIGTERM', shutdown); }",
      errors: [error],
    },
  ],
  valid: [
    "import closeWithGrace from 'close-with-grace'; closeWithGrace({ delay: 10_000 }, async () => { await app.close(); });",
    // Other process events are fine.
    "process.on('exit', (code) => log(code));",
    "process.on('warning', (warning) => log(warning));",
    "process.on('message', handle);",
    // Dynamic event names cannot be judged statically.
    'process.on(signal, shutdown);',
    'process.on(`${prefix}TERM`, shutdown);',
    // Not the Node process object.
    "const process = new EventEmitter(); process.on('SIGTERM', shutdown);",
    "function run(process: EventEmitter) { process.on('SIGTERM', shutdown); }",
    "import { process } from './worker.ts'; process.on('SIGTERM', shutdown);",
    "emitter.on('SIGTERM', shutdown);",
    "process.off('SIGTERM', shutdown);",
    "process.emit('SIGTERM');",
  ],
});
