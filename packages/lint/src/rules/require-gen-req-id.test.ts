import { RuleTester } from 'oxlint/plugins-dev';

import { requireGenReqIdRule } from './require-gen-req-id.ts';

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: 'ts' } } });
const error = { messageId: 'missingGenReqId' };

tester.run('rm3-fastify/require-gen-req-id', requireGenReqIdRule, {
  invalid: [
    { code: "import Fastify from 'fastify'; Fastify();", errors: [error] },
    { code: "import Fastify from 'fastify'; Fastify({});", errors: [error] },
    {
      code: "import Fastify from 'fastify'; Fastify({ loggerInstance: logger, requestIdHeader: false });",
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
      code: "import Fastify from 'fastify'; Fastify<Server>({ logger: true });",
      errors: [error],
    },
    {
      code: "import Fastify from 'fastify'; Fastify({ logger: true } satisfies FastifyServerOptions);",
      errors: [error],
    },
  ],
  valid: [
    "import Fastify from 'fastify'; Fastify({ genReqId: () => randomUUID(), loggerInstance: logger });",
    "import Fastify from 'fastify'; Fastify({ 'genReqId': makeId });",
    "import Fastify from 'fastify'; Fastify({ genReqId });",
    "import Fastify from 'fastify'; Fastify<Server>({ genReqId: () => randomUUID() });",
    "import Fastify from 'fastify'; Fastify(options);",
    "import Fastify from 'fastify'; Fastify({ ...base, logger: true });",
    "import Fastify from './fastify.ts'; Fastify();",
    'const Fastify = () => ({}); Fastify();',
    'new LogController({ disableRequestLogging: true });',
  ],
});
