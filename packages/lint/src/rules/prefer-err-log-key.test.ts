import { RuleTester } from 'oxlint/plugins-dev';

import { preferErrLogKeyRule } from './prefer-err-log-key.ts';

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: 'ts' } } });
const error = { messageId: 'errorKey' };

tester.run('rm3-node/prefer-err-log-key', preferErrLogKeyRule, {
  invalid: [
    { code: "logger.error({ error }, 'failed to start server');", errors: [error] },
    { code: "app.log.error({ error }, 'failed to checkpoint');", errors: [error] },
    { code: "request.log.warn({ connectorId, error: cause }, 'sync failed');", errors: [error] },
    { code: "this.log.error({ error: err }, 'x');", errors: [error] },
    { code: "log.error({ 'error': e });", errors: [error] },
    { code: "log.fatal({ error: new Error('boom') }, 'x');", errors: [error] },
    { code: "log.error({ error: result.error }, 'x');", errors: [error] },
    { code: "log.error({ error: toError(cause) }, 'x');", errors: [error] },
    { code: "fastify.log.info({ error }, 'x');", errors: [error] },
  ],
  valid: [
    "logger.error({ err: error }, 'failed to start server');",
    "request.log.error({ err }, 'request failed');",
    // An Error as the first argument is pino's other documented form.
    "log.error(error, 'x');",
    'log.error(error);',
    // A string under `error` is a code, not an Error object.
    "log.warn({ error: 'INVALID_TOKEN' }, 'rejected');",
    "log.warn({ error: `E_${code}` }, 'rejected');",
    // `error` in the message position is a printf argument, not a field.
    "log.error('failed: %s', error);",
    // Not a pino-shaped call.
    'console.error({ error });',
    'metrics.error({ error });',
    "logger.child({ error }).info('x');",
    "log.info({ nested: { error } }, 'x');",
  ],
});
