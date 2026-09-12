import { defineRule } from '@oxlint/plugins';

import { objectPropertyName } from '#shared/global-binding.ts';
import { logLevelOf } from '#shared/log-calls.ts';

/** Value shapes that hold an object at runtime; a string under `error` is a code, not an Error. */
const ERROR_VALUE_TYPES: ReadonlySet<string> = new Set([
  'AwaitExpression',
  'CallExpression',
  'Identifier',
  'MemberExpression',
  'NewExpression',
]);

/** Report `log.error({ error }, ...)`: pino only serializes an Error under `err`. */
export const preferErrLogKeyRule = defineRule({
  createOnce(context) {
    return {
      CallExpression(node) {
        if (logLevelOf(node) === null) {
          return;
        }
        const [fields] = node.arguments;
        if (fields?.type !== 'ObjectExpression') {
          return;
        }
        for (const property of fields.properties) {
          if (
            property.type === 'Property' &&
            objectPropertyName(property) === 'error' &&
            ERROR_VALUE_TYPES.has(property.value.type)
          ) {
            context.report({ messageId: 'errorKey', node: property });
          }
        }
      },
    };
  },
  meta: {
    docs: {
      description:
        'Require errors in a log call to sit under the err key; pino serializes only that key, so an Error under error logs as an empty object.',
    },
    messages: {
      errorKey:
        "Log the error as `{ err: error }`, not `{ error }`. pino's error serializer is bound to the `err` key (message, stack, cause, code); any other key goes through JSON.stringify, and an Error's fields are non-enumerable, so the line shows `{}`.",
    },
    type: 'problem',
  },
});
