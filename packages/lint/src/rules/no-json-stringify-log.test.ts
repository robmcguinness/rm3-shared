import { RuleTester } from 'oxlint/plugins-dev';

import { noJsonStringifyLogRule } from './no-json-stringify-log.ts';

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: 'ts' } } });
const error = { messageId: 'stringifiedMessage' };

tester.run('rm3-node/no-json-stringify-log', noJsonStringifyLogRule, {
  invalid: [
    { code: 'log.info(JSON.stringify(wideEvent));', errors: [error] },
    { code: 'logger.info(JSON.stringify(wideEvent));', errors: [error] },
    { code: 'log.info({ requestId }, JSON.stringify(wideEvent));', errors: [error] },
    { code: "log.info(JSON.stringify(event), 'request completed');", errors: [error] },
    { code: 'request.log.error(JSON.stringify({ err }));', errors: [error] },
    { code: "app.log.warn(JSON['stringify'](event));", errors: [error] },
    { code: 'this.log.debug(JSON.stringify(payload, null, 2));', errors: [error] },
    { code: 'getLog().info(JSON.stringify(x));', errors: [error] },
  ],
  valid: [
    "log.info(wideEvent, 'request completed');",
    "log.info({ ...wideEvent }, 'x');",
    "log.info({ payload: JSON.stringify(body) }, 'x');",
    'log.info(JSON.parse(text));',
    'log.info(serialize(event));',
    'log.info(`${JSON.stringify(x)}`);',
    "const JSON = { stringify: (v: unknown) => '' }; log.info(JSON.stringify(x));",
    'function f(JSON: Serializer) { log.info(JSON.stringify(x)); }',
    'console.log(JSON.stringify(x));',
    'metrics.info(JSON.stringify(x));',
    'logger.child({ id }).info(JSON.stringify(x));',
  ],
});
