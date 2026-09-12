import { RuleTester } from 'oxlint/plugins-dev';

import { noLogStringInterpolationRule } from './no-log-string-interpolation.ts';

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: 'ts' } } });
const error = { messageId: 'interpolatedMessage' };

tester.run('rm3-node/no-log-string-interpolation', noLogStringInterpolationRule, {
  invalid: [
    { code: 'log.info(`User ${userId} created`);', errors: [error] },
    { code: "log.info('User ' + userId + ' created');", errors: [error] },
    { code: "log.info('User ' + userId);", errors: [error] },
    { code: 'request.log.error({ err }, `failed for ${id}`);', errors: [error] },
    { code: "app.log.warn({ id }, 'slow: ' + ms + 'ms');", errors: [error] },
    { code: 'logger.debug(`${prefix}: ready`);', errors: [error] },
    { code: "this.log.info('a' + 'b' + count);", errors: [error] },
    { code: 'getLog().info(`user ${id} created`);', errors: [error] },
    { code: 'getLogger(ctx).warn(`slow ${ms}ms`);', errors: [error] },
    {
      code: '(getLogger(ctx) ?? logger).error({ err }, `failed for ${id}`);',
      errors: [error],
    },
  ],
  valid: [
    "log.info({ userId }, 'user created');",
    "request.log.error({ err, id }, 'request failed');",
    // pino's printf placeholders keep the message constant.
    "log.info('user %s created', userId);",
    // No interpolation: a constant template or a constant concatenation.
    'log.info(`user created`);',
    "log.info('user ' + 'created');",
    // A fields object with no message.
    'log.info({ userId });',
    // Numeric addition is not a message.
    'log.info(a + b);',
    // Not a pino-shaped call.
    'console.log(`User ${userId} created`);',
    'notify.info(`User ${userId} created`);',
    'logger.child({ id }).info(`ready ${id}`);',
    "getLog().info({ id }, 'user created');",
    "(getLogger(ctx) ?? logger).error({ err }, 'failed');",
    'getConfig().info(`x ${y}`);',
    '(a ?? b).info(`x ${y}`);',
  ],
});
