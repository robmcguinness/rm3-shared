import { isImportedFrom, objectPropertyName } from '#shared/global-binding.ts';

import type { ESTree, SourceCode } from '@oxlint/plugins';

// Both `import Fastify from 'fastify'` and `import { fastify } from 'fastify'`
// are the factory; a namespace import (`f.fastify()`) is a MemberExpression
// callee and is not matched (documented limit).
const fastifyModules: ReadonlySet<string> = new Set(['fastify']);
const fastifyBindings: ReadonlySet<string> = new Set(['default', 'fastify']);

export type FactoryOptions =
  | { kind: 'absent' }
  | { kind: 'literal'; node: ESTree.ObjectExpression }
  | { kind: 'opaque' };

/** `Fastify({...} as X)` / `satisfies X`: the literal is still readable underneath. */
function unwrapTypeAssertion(expression: ESTree.Node): ESTree.Node {
  let current = expression;
  while (current.type === 'TSAsExpression' || current.type === 'TSSatisfiesExpression') {
    current = current.expression;
  }
  return current;
}

/**
 * The options argument of a `fastify()` factory call, or null when the call
 * is not the factory. `Fastify<Server>({...})` is a plain CallExpression with
 * `typeArguments`, so the callee check is unchanged. An identifier, a call,
 * or a literal with a spread is opaque: the rules cannot see inside it.
 */
export function fastifyFactoryOptions(
  sourceCode: SourceCode,
  call: ESTree.CallExpression,
): FactoryOptions | null {
  if (!isImportedFrom(sourceCode, call.callee, fastifyModules, fastifyBindings)) {
    return null;
  }
  const [first] = call.arguments;
  if (first === undefined) {
    return { kind: 'absent' };
  }
  const options = unwrapTypeAssertion(first);
  if (
    options.type !== 'ObjectExpression' ||
    options.properties.some((property) => property.type === 'SpreadElement')
  ) {
    return { kind: 'opaque' };
  }
  return { kind: 'literal', node: options };
}

/** The `name: value` property of an options literal, or undefined. Computed non-string keys never match. */
export function factoryOption(
  options: ESTree.ObjectExpression,
  name: string,
): ESTree.ObjectProperty | undefined {
  return options.properties.find(
    (property): property is ESTree.ObjectProperty =>
      property.type === 'Property' && objectPropertyName(property) === name,
  );
}
