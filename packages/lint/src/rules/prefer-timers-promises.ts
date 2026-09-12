import { defineRule } from '@oxlint/plugins';

import { isGlobalIdentifier } from '#shared/global-binding.ts';

import type { ESTree, SourceCode } from '@oxlint/plugins';

const timerFunctions = ['setTimeout', 'setImmediate'] as const;

type Executor = ESTree.ArrowFunctionExpression | ESTree.Function;

function unwrap(expression: ESTree.Expression): ESTree.Expression {
  let current = expression;
  while (current.type === 'ParenthesizedExpression') {
    current = current.expression;
  }
  return current;
}

/** The single expression an executor body evaluates, or null if it does more than one thing. */
function executorExpression(executor: Executor): ESTree.Expression | null {
  const { body } = executor;
  if (body === null) {
    return null;
  }
  if (body.type !== 'BlockStatement') {
    return unwrap(body);
  }
  if (body.body.length !== 1) {
    return null;
  }
  const [statement] = body.body;
  if (statement === undefined) {
    return null;
  }
  if (statement.type === 'ExpressionStatement') {
    return unwrap(statement.expression);
  }
  if (statement.type === 'ReturnStatement' && statement.argument !== null) {
    return unwrap(statement.argument);
  }
  return null;
}

function resolveParameterName(executor: Executor): string | null {
  const [first] = executor.params;
  return first?.type === 'Identifier' ? first.name : null;
}

/** Whether a call is `setTimeout(resolve, ...)` / `setImmediate(resolve)` for the executor's resolve. */
function isTimerResolvingCall(
  sourceCode: SourceCode,
  expression: ESTree.Expression,
  resolveName: string,
): expression is ESTree.CallExpression {
  if (expression.type !== 'CallExpression') {
    return false;
  }
  const timer = timerFunctions.find((name) =>
    isGlobalIdentifier(sourceCode, expression.callee, name),
  );
  if (timer === undefined) {
    return false;
  }
  const [callback] = expression.arguments;
  return callback?.type === 'Identifier' && callback.name === resolveName;
}

/** Report `new Promise((resolve) => setTimeout(resolve, ms))`, which `node:timers/promises` already provides. */
export const preferTimersPromisesRule = defineRule({
  createOnce(context) {
    return {
      NewExpression(node) {
        if (!isGlobalIdentifier(context.sourceCode, node.callee, 'Promise')) {
          return;
        }
        const [executor] = node.arguments;
        if (
          executor === undefined ||
          (executor.type !== 'ArrowFunctionExpression' && executor.type !== 'FunctionExpression')
        ) {
          return;
        }
        const resolveName = resolveParameterName(executor);
        if (resolveName === null) {
          return;
        }
        const expression = executorExpression(executor);
        if (expression === null) {
          return;
        }
        if (isTimerResolvingCall(context.sourceCode, expression, resolveName)) {
          const timer =
            expression.callee.type === 'Identifier' ? expression.callee.name : 'setTimeout';
          context.report({ data: { timer }, messageId: 'preferTimersPromises', node });
        }
      },
    };
  },
  meta: {
    docs: {
      description:
        'Disallow wrapping setTimeout or setImmediate in a Promise; import the promise-returning versions from node:timers/promises.',
    },
    messages: {
      preferTimersPromises:
        "Replace `new Promise((resolve) => {{timer}}(resolve, ...))` with `await {{timer}}(...)` from 'node:timers/promises'. It accepts an AbortSignal and needs no executor.",
    },
    type: 'suggestion',
  },
});
