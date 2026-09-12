import { defineRule } from '@oxlint/plugins';

import { factoryOption, fastifyFactoryOptions } from '#shared/fastify-factory.ts';

/** Whether an option is explicitly the boolean literal `false`. */
function isFalse(option: ReturnType<typeof factoryOption>): boolean {
  return option?.value.type === 'Literal' && option.value.value === false;
}

/** Report configured Fastify loggers that retain the default two request log lines. */
export const noDefaultRequestLoggingRule = defineRule({
  createOnce(context) {
    return {
      CallExpression(node) {
        const options = fastifyFactoryOptions(context.sourceCode, node);
        if (options?.kind !== 'literal') {
          return;
        }
        const logger =
          factoryOption(options.node, 'loggerInstance') ?? factoryOption(options.node, 'logger');
        if (logger === undefined || isFalse(logger)) {
          return;
        }
        if (factoryOption(options.node, 'logController') !== undefined) {
          return;
        }
        const disableRequestLogging = factoryOption(options.node, 'disableRequestLogging');
        if (disableRequestLogging !== undefined && !isFalse(disableRequestLogging)) {
          return;
        }
        context.report({ messageId: 'defaultRequestLogging', node: logger });
      },
    };
  },
  meta: {
    docs: {
      description:
        "Disallow Fastify's default per-request logging when a logger is configured; the wide event from an `onResponse` hook is the one line per request.",
    },
    messages: {
      defaultRequestLogging:
        "Add `logController: new LogController({ disableRequestLogging: true })` next to the logger option and emit one event per request from an `onResponse` hook. Fastify otherwise logs `incoming request` and `request completed` for every request, two lines with none of the handler's fields, on top of the wide event.",
    },
    type: 'suggestion',
  },
});
