import { defineRule } from '@oxlint/plugins';

import { enclosingFunction, isFastifyHandler } from '#shared/fastify-handlers.ts';
import type { FunctionNode } from '#shared/functions.ts';
import { memberPropertyName, resolveVariable } from '#shared/global-binding.ts';

import type { ESTree, SourceCode } from '@oxlint/plugins';

/** Reply methods that end the response; `code`, `header` and `type` only stage it. */
const SENDING_METHODS: ReadonlySet<string> = new Set([
  'callNotFound',
  'redirect',
  'send',
  'sendFile',
]);

/** `reply` in `reply.code(404).send(x)`: the identifier at the root of a member and call chain. */
function chainRoot(expression: ESTree.Expression): ESTree.IdentifierReference | null {
  switch (expression.type) {
    case 'CallExpression': {
      return chainRoot(expression.callee);
    }
    case 'Identifier': {
      return expression;
    }
    case 'MemberExpression': {
      return chainRoot(expression.object);
    }
    default: {
      return null;
    }
  }
}

/** Whether the identifier is one of the function's own parameters, not a closure or a local. */
function isParameterOf(
  sourceCode: SourceCode,
  identifier: ESTree.IdentifierReference,
  fn: FunctionNode,
): boolean {
  const variable = resolveVariable(sourceCode, identifier);
  return (
    variable?.scope.block === fn &&
    variable.defs.some((definition) => definition.type === 'Parameter')
  );
}

/** Report `reply.send(...)` as a bare statement inside an async Fastify handler or hook. */
export const returnReplyRule = defineRule({
  createOnce(context) {
    return {
      ExpressionStatement(node) {
        const { expression } = node;
        if (expression.type !== 'CallExpression') {
          return;
        }
        const method = memberPropertyName(expression.callee);
        if (method === null || !SENDING_METHODS.has(method)) {
          return;
        }
        const root = chainRoot(expression);
        if (root === null) {
          return;
        }
        const fn = enclosingFunction(node);
        if (fn === null || !fn.async || !isFastifyHandler(fn)) {
          return;
        }
        if (isParameterOf(context.sourceCode, root, fn)) {
          context.report({ data: { method, reply: root.name }, messageId: 'bareReply', node });
        }
      },
    };
  },
  meta: {
    docs: {
      description:
        'Require an async Fastify handler or hook to return or await the reply it sends; a bare reply.send leaves the chain running after the response is out.',
    },
    messages: {
      bareReply:
        'Write `return {{reply}}.{{method}}(...)` or `await` it. Fastify treats the promise from an async handler or hook as the response; a bare `{{method}}` lets hooks and the handler keep running after the response has gone out, which ends in FST_ERR_REP_ALREADY_SENT or a second send of `undefined`.',
    },
    type: 'problem',
  },
});
