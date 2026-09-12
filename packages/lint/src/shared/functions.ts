import type { ESTree } from '@oxlint/plugins';

export type FunctionNode = ESTree.ArrowFunctionExpression | ESTree.Function;

/** The three function syntaxes; class bodies and blocks are not function boundaries. */
export function isFunctionNode(node: ESTree.Node): node is FunctionNode {
  return (
    node.type === 'ArrowFunctionExpression' ||
    node.type === 'FunctionDeclaration' ||
    node.type === 'FunctionExpression'
  );
}
