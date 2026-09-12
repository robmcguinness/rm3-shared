import { defineRule } from '@oxlint/plugins';

import { isFunctionNode } from '#shared/functions.ts';
import { logLevelOf } from '#shared/log-calls.ts';

import type { ESTree } from '@oxlint/plugins';

type LoopNode =
  | ESTree.DoWhileStatement
  | ESTree.ForInStatement
  | ESTree.ForOfStatement
  | ESTree.ForStatement
  | ESTree.WhileStatement;

/** The syntactic loops. `forEach` / `map` callbacks are calls, not loops (documented limit). */
function isLoopNode(node: ESTree.Node): node is LoopNode {
  return (
    node.type === 'DoWhileStatement' ||
    node.type === 'ForInStatement' ||
    node.type === 'ForOfStatement' ||
    node.type === 'ForStatement' ||
    node.type === 'WhileStatement'
  );
}

/**
 * Whether the call sits in the body of a loop in the same function. The
 * `body === child` test excludes the loop's `test` / `update` / `right`
 * positions; a function boundary stops the walk, so a callback declared
 * inside a loop is not "in" the loop.
 */
function isInsideLoopBody(node: ESTree.CallExpression): boolean {
  let child: ESTree.Node = node;
  let current: ESTree.Node | null = node.parent;
  while (current !== null && current.type !== 'Program') {
    if (isLoopNode(current)) {
      if (current.body === child) {
        return true;
      }
    } else if (isFunctionNode(current)) {
      return false;
    }
    child = current;
    current = current.parent;
  }
  return false;
}

/** Report pino-shaped log calls that emit one line for every loop iteration. */
export const noLogInLoopRule = defineRule({
  createOnce(context) {
    return {
      CallExpression(node) {
        if (logLevelOf(node) !== null && isInsideLoopBody(node)) {
          context.report({ messageId: 'logInLoop', node });
        }
      },
    };
  },
  meta: {
    docs: {
      description:
        'Disallow a log call inside a loop body; emit one event after the loop with the counts and the failed items as fields.',
    },
    messages: {
      logInLoop:
        "Collect what each iteration would log and emit one event after the loop, with the count and the failed items as fields (`log.warn({ failed, total }, 'legacy bookmarks converted')`). One line per iteration scales the log volume with the input and scatters a single operation over lines that cannot be queried together.",
    },
    type: 'suggestion',
  },
});
