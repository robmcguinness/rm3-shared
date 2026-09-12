import { defineRule } from '@oxlint/plugins';

import { factoryOption, fastifyFactoryOptions } from '#shared/fastify-factory.ts';

/** Report Fastify factory calls whose readable options do not configure request ids. */
export const requireGenReqIdRule = defineRule({
  createOnce(context) {
    return {
      CallExpression(node) {
        const options = fastifyFactoryOptions(context.sourceCode, node);
        if (options === null || options.kind === 'opaque') {
          return;
        }
        if (options.kind === 'absent') {
          context.report({ messageId: 'missingGenReqId', node });
          return;
        }
        if (factoryOption(options.node, 'genReqId') === undefined) {
          context.report({ messageId: 'missingGenReqId', node: options.node });
        }
      },
    };
  },
  meta: {
    docs: {
      description:
        'Require a `genReqId` on the Fastify factory; the default request id is a per-process counter and cannot correlate events across restarts or instances.',
    },
    messages: {
      missingGenReqId:
        'Pass `genReqId: () => randomUUID()` to the Fastify factory. The default request id is a per-process counter that starts again at 1 on every restart, so the same `reqId` names different requests across restarts and instances and the wide event cannot be joined to anything.',
    },
    type: 'problem',
  },
});
