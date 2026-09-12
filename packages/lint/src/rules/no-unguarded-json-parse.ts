import { defineRule } from '@oxlint/plugins';

import { isGlobalIdentifier, memberPropertyName } from '#shared/global-binding.ts';

import type { ESTree } from '@oxlint/plugins';

function isFunctionBoundary(node: ESTree.Node): boolean {
  return (
    node.type === 'ArrowFunctionExpression' ||
    node.type === 'FunctionDeclaration' ||
    node.type === 'FunctionExpression'
  );
}

/**
 * Whether the call sits inside the `try` block of a `try` statement in the
 * same function. A `try` in an enclosing function does not guard a callback,
 * and the `catch` or `finally` block of a `try` is not guarded by it.
 */
function isInsideTryBlock(node: ESTree.CallExpression): boolean {
  let child: ESTree.Node = node;
  let current: ESTree.Node | null = node.parent;
  while (current !== null && current.type !== 'Program') {
    if (current.type === 'TryStatement') {
      if (current.block === child) {
        return true;
      }
    } else if (isFunctionBoundary(current)) {
      return false;
    }
    child = current;
    current = current.parent;
  }
  return false;
}

/** Report `JSON.parse(...)` calls that no enclosing `try` block covers. */
export const noUnguardedJsonParseRule = defineRule({
  createOnce(context) {
    return {
      CallExpression(node) {
        const { callee } = node;
        if (callee.type !== 'MemberExpression' || memberPropertyName(callee) !== 'parse') {
          return;
        }
        if (!isGlobalIdentifier(context.sourceCode, callee.object, 'JSON')) {
          return;
        }
        if (!isInsideTryBlock(node)) {
          context.report({ messageId: 'unguardedJsonParse', node });
        }
      },
    };
  },
  meta: {
    docs: {
      description:
        'Require JSON.parse to run inside a try block; malformed input throws a SyntaxError that schema validation does not catch.',
    },
    messages: {
      unguardedJsonParse:
        'Wrap `JSON.parse` in `try`/`catch`, or route it through a helper that turns `SyntaxError` into a typed error. A schema `safeParse` on the result does not catch malformed JSON.',
    },
    type: 'problem',
  },
});
