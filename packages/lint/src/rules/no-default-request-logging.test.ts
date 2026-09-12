import { RuleTester } from 'oxlint/plugins-dev';

import { noDefaultRequestLoggingRule } from './no-default-request-logging.ts';

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: 'ts' } } });
const error = { messageId: 'defaultRequestLogging' };

tester.run('rm3-fastify/no-default-request-logging', noDefaultRequestLoggingRule, {
  invalid: [
    {
      code: "import Fastify from 'fastify'; Fastify({ loggerInstance: logger });",
      errors: [error],
    },
    {
      code: "import fastify from 'fastify'; fastify({ loggerInstance: logger });",
      errors: [error],
    },
    {
      code: "import { fastify } from 'fastify'; fastify({ logger: true });",
      errors: [error],
    },
    {
      code: "import Fastify from 'fastify'; Fastify({ logger: { level: 'info' } });",
      errors: [error],
    },
    {
      code: "import Fastify from 'fastify'; Fastify({ disableRequestLogging: false, loggerInstance: logger });",
      errors: [error],
    },
    {
      code: "import Fastify from 'fastify'; Fastify<Server>({ genReqId: () => randomUUID(), loggerInstance: logger });",
      errors: [error],
    },
  ],
  valid: [
    "import Fastify, { LogController } from 'fastify'; Fastify({ logController: new LogController({ disableRequestLogging: true }), loggerInstance: logger });",
    "import Fastify from 'fastify'; Fastify({ logController: quietLogController, logger: true });",
    "import Fastify from 'fastify'; Fastify({ disableRequestLogging: true, loggerInstance: logger });",
    "import Fastify from 'fastify'; Fastify({ disableRequestLogging: env.QUIET, logger: true });",
    "import Fastify from 'fastify'; Fastify({ logger: false });",
    "import Fastify from 'fastify'; Fastify();",
    "import Fastify from 'fastify'; Fastify({ genReqId: () => randomUUID() });",
    "import Fastify from 'fastify'; Fastify(options);",
    "import Fastify from 'fastify'; Fastify({ ...base, loggerInstance: logger });",
    "import Fastify from './fastify.ts'; Fastify({ logger: true });",
  ],
});
