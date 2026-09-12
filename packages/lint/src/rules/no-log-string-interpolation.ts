import { defineRule } from '@oxlint/plugins';

import { logLevelOf, logMessageArgument } from '#shared/log-calls.ts';

import type { ESTree } from '@oxlint/plugins';

/** A string literal, a template, or a `+` with a string on either side; numeric `a + b` is not a message. */
function isStringExpression(expression: ESTree.Node): boolean {
  if (expression.type === 'Literal') {
    return typeof expression.value === 'string';
  }
  if (expression.type === 'TemplateLiteral') {
    return true;
  }
  if (expression.type === 'BinaryExpression' && expression.operator === '+') {
    return isStringExpression(expression.left) || isStringExpression(expression.right);
  }
  return false;
}

/** Fully known at edit time: no `${}` and no non-literal operand anywhere in the concatenation. */
function isConstantString(expression: ESTree.Node): boolean {
  if (expression.type === 'Literal') {
    return typeof expression.value === 'string';
  }
  if (expression.type === 'TemplateLiteral') {
    return expression.expressions.length === 0;
  }
  if (expression.type === 'BinaryExpression' && expression.operator === '+') {
    return isConstantString(expression.left) && isConstantString(expression.right);
  }
  return false;
}

/** Report a log message built from `${}` or `+`; the values belong in the fields object. */
export const noLogStringInterpolationRule = defineRule({
  createOnce(context) {
    return {
      CallExpression(node) {
        if (logLevelOf(node) === null) {
          return;
        }
        const message = logMessageArgument(node);
        if (message === undefined || !isStringExpression(message) || isConstantString(message)) {
          return;
        }
        context.report({ messageId: 'interpolatedMessage', node: message });
      },
    };
  },
  meta: {
    docs: {
      description:
        'Disallow building a log message with template interpolation or string concatenation; put the values in the fields object so the message stays constant and queryable.',
    },
    messages: {
      interpolatedMessage:
        "Keep the message constant and pass the values as fields: `log.info({ userId }, 'user created')`. A message with `${}` or `+` in it is a different string on every line, so it cannot be grouped, counted or searched.",
    },
    type: 'suggestion',
  },
});
