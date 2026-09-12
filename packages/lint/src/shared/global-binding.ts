import type { ESTree, Scope, SourceCode, Variable } from '@oxlint/plugins';

function resolveVariable(
  sourceCode: SourceCode,
  identifier: ESTree.IdentifierReference,
): Variable | null {
  let scope: Scope | null = sourceCode.getScope(identifier);
  while (scope !== null) {
    const variable = scope.set.get(identifier.name);
    if (variable !== undefined) {
      return variable;
    }
    scope = scope.upper;
  }
  return null;
}

/**
 * Whether an expression is a bare reference to the named global: `JSON`,
 * `Promise`, `setTimeout`. A local binding of the same name (a parameter, an
 * import from somewhere else) is not a global.
 */
export function isGlobalIdentifier(
  sourceCode: SourceCode,
  expression: ESTree.Expression,
  name: string,
): expression is ESTree.IdentifierReference {
  if (expression.type !== 'Identifier' || expression.name !== name) {
    return false;
  }
  if (sourceCode.isGlobalReference(expression)) {
    return true;
  }
  const variable = resolveVariable(sourceCode, expression);
  return variable === null || variable.defs.length === 0;
}

function importedName(node: ESTree.Node): string | null {
  if (node.type === 'ImportDefaultSpecifier') {
    return 'default';
  }
  if (node.type !== 'ImportSpecifier') {
    return null;
  }
  return node.imported.type === 'Identifier' ? node.imported.name : node.imported.value;
}

/**
 * Whether an identifier is bound by `import x from <source>` or
 * `import { <name> } from <source>` for one of the given sources. Used for
 * Node globals that also ship as modules: `process` is both a global and the
 * default export of `node:process`.
 */
export function isImportedFrom(
  sourceCode: SourceCode,
  expression: ESTree.Expression,
  sources: ReadonlySet<string>,
  names: ReadonlySet<string>,
): expression is ESTree.IdentifierReference {
  if (expression.type !== 'Identifier') {
    return false;
  }
  const variable = resolveVariable(sourceCode, expression);
  if (variable === null) {
    return false;
  }
  return variable.defs.some((definition) => {
    if (definition.type !== 'ImportBinding' || definition.parent?.type !== 'ImportDeclaration') {
      return false;
    }
    const name = importedName(definition.node);
    return sources.has(definition.parent.source.value) && name !== null && names.has(name);
  });
}

/**
 * The property name of `object.name` or `object['name']`, or null for a
 * private field or a computed key that is not a string literal.
 */
export function memberPropertyName(callee: ESTree.Expression): string | null {
  if (callee.type !== 'MemberExpression') {
    return null;
  }
  const { property } = callee;
  if (callee.computed) {
    return property.type === 'Literal' && typeof property.value === 'string'
      ? property.value
      : null;
  }
  return property.type === 'Identifier' ? property.name : null;
}
