import { defineRule } from '@oxlint/plugins';

import { isGlobalIdentifier, memberPropertyName } from '#shared/global-binding.ts';
import { logLevelOf, logMessageArgument } from '#shared/log-calls.ts';

/** Report a global `JSON.stringify(...)` used as a pino log message. */
export const noJsonStringifyLogRule = defineRule({
  createOnce(context) {
    return {
      CallExpression(node) {
        if (logLevelOf(node) === null) {
          return;
        }
        const message = logMessageArgument(node);
        // The helper selects either the first argument or the message after a fields object.
        if (
          message?.type === 'CallExpression' &&
          message.callee.type === 'MemberExpression' &&
          memberPropertyName(message.callee) === 'stringify' &&
          isGlobalIdentifier(context.sourceCode, message.callee.object, 'JSON')
        ) {
          context.report({ messageId: 'stringifiedMessage', node: message });
        }
      },
    };
  },
  meta: {
    docs: {
      description:
        'Disallow `JSON.stringify(...)` as a log message; pino serializes the fields object itself and a stringified one lands in `msg` unqueryable.',
    },
    messages: {
      stringifiedMessage:
        "Pass the object as the fields argument with a constant message: `log.info(wideEvent, 'request completed')`. pino serializes the fields itself; `JSON.stringify` puts the whole object into `msg` as one string, so nothing inside it can be filtered, grouped or aggregated.",
    },
    type: 'problem',
  },
});
