import { isClassAttribute, staticTokenGroups, walkClassExpression } from '#shared/class-strings.ts';

import type { ClassToken, ClassValueVisitor } from '#shared/class-strings.ts';

import type { ESTree } from '@oxlint/plugins';

/** `Foo` for `<Foo>`, `Bar` for `<Foo.Bar>`; null for a namespaced `<svg:rect>`. */
export function elementName(node: ESTree.JSXOpeningElement): string | null {
  switch (node.name.type) {
    case 'JSXIdentifier':
      return node.name.name;
    case 'JSXMemberExpression':
      return node.name.property.name;
    default:
      return null;
  }
}

/** The JSX attribute `name` on an opening element, or null. Spread attributes are not searched. */
export function attribute(
  node: ESTree.JSXOpeningElement,
  name: string,
): ESTree.JSXAttribute | null {
  for (const item of node.attributes) {
    if (
      item.type === 'JSXAttribute' &&
      item.name.type === 'JSXIdentifier' &&
      item.name.name === name
    ) {
      return item;
    }
  }
  return null;
}

/**
 * The JSX element `node` renders inside, through fragments, expression
 * containers and the callbacks of `items.map(...)`. An element in a prop
 * (`render={<Foo />}`) is not a child, so the walk stops at the attribute.
 */
export function enclosingElement(node: ESTree.JSXElement): ESTree.JSXElement | null {
  let current: ESTree.Node | null = node.parent;
  while (current !== null) {
    if (current.type === 'JSXElement') {
      return current;
    }
    if (current.type === 'JSXAttribute') {
      return null;
    }
    current = current.parent;
  }
  return null;
}

/** The names of the JSX elements enclosing `node`, nearest first. */
export function enclosingElementNames(node: ESTree.JSXElement): string[] {
  const names: string[] = [];
  let current = enclosingElement(node);
  while (current !== null) {
    const name = elementName(current.openingElement);
    if (name !== null) {
      names.push(name);
    }
    current = enclosingElement(current);
  }
  return names;
}

/** The expression inside parentheses or a TypeScript cast, or null. */
function unwrapped(expression: ESTree.Expression): ESTree.Expression | null {
  switch (expression.type) {
    case 'ParenthesizedExpression':
    case 'TSAsExpression':
    case 'TSNonNullExpression':
    case 'TSSatisfiesExpression':
    case 'TSTypeAssertion':
      return expression.expression;
    default:
      return null;
  }
}

type FunctionLike = ESTree.ArrowFunctionExpression | ESTree.Function;

function isFunctionLike(node: ESTree.Node): node is FunctionLike {
  return node.type === 'ArrowFunctionExpression' || node.type === 'FunctionExpression';
}

/**
 * Every JSX element rendered under `root`, in source order, looking through
 * fragments, `{cond ? <A /> : <B />}`, `{cond && <A />}`, arrays, casts and
 * the callback of `{items.map((item) => <Row />)}`. Descent stops at an
 * element for which `stopAt` returns true (the element itself is still
 * listed), so a nested container of the same family is not searched.
 */
export function descendantElements(
  root: ESTree.JSXElement | ESTree.JSXFragment,
  stopAt: (name: string | null) => boolean = () => false,
): ESTree.JSXElement[] {
  const found: ESTree.JSXElement[] = [];

  const visitChildren = (children: readonly ESTree.JSXChild[]): void => {
    for (const child of children) {
      visitChild(child);
    }
  };

  const visitFunction = (fn: FunctionLike): void => {
    if (fn.body === null) {
      return;
    }
    if (fn.body.type === 'BlockStatement') {
      for (const statement of fn.body.body) {
        if (statement.type === 'ReturnStatement' && statement.argument !== null) {
          visitExpression(statement.argument);
        }
      }
    } else {
      visitExpression(fn.body);
    }
  };

  const visitExpression = (expression: ESTree.Expression): void => {
    const inner = unwrapped(expression);
    if (inner !== null) {
      visitExpression(inner);
      return;
    }
    switch (expression.type) {
      case 'ArrayExpression':
        for (const element of expression.elements) {
          if (element !== null && element.type !== 'SpreadElement') {
            visitExpression(element);
          }
        }
        break;
      case 'ArrowFunctionExpression':
      case 'FunctionExpression':
        visitFunction(expression);
        break;
      case 'CallExpression':
        for (const argument of expression.arguments) {
          if (isFunctionLike(argument)) {
            visitFunction(argument);
          }
        }
        break;
      case 'ConditionalExpression':
        visitExpression(expression.consequent);
        visitExpression(expression.alternate);
        break;
      case 'JSXElement':
        found.push(expression);
        if (!stopAt(elementName(expression.openingElement))) {
          visitChildren(expression.children);
        }
        break;
      case 'JSXFragment':
        visitChildren(expression.children);
        break;
      case 'LogicalExpression':
        visitExpression(expression.left);
        visitExpression(expression.right);
        break;
      default:
    }
  };

  const visitChild = (child: ESTree.JSXChild): void => {
    switch (child.type) {
      case 'JSXElement':
      case 'JSXFragment':
        visitExpression(child);
        break;
      case 'JSXExpressionContainer':
        if (child.expression.type !== 'JSXEmptyExpression') {
          visitExpression(child.expression);
        }
        break;
      default:
    }
  };

  visitChildren(root.children);
  return found;
}

/**
 * Whether an expression may render markup the linter cannot see: a variable,
 * a property, a call without an inline callback, an `await`. `{cond && x}`
 * only looks at `x`, since the left side is a guard, not content.
 */
export function isOpaque(expression: ESTree.Expression): boolean {
  const inner = unwrapped(expression);
  if (inner !== null) {
    return isOpaque(inner);
  }
  switch (expression.type) {
    case 'AwaitExpression':
    case 'ChainExpression':
    case 'Identifier':
    case 'MemberExpression':
    case 'TaggedTemplateExpression':
      return true;
    case 'CallExpression':
      return !expression.arguments.some(isFunctionLike);
    case 'ConditionalExpression':
      return isOpaque(expression.consequent) || isOpaque(expression.alternate);
    case 'LogicalExpression':
      return (
        isOpaque(expression.right) || (expression.operator !== '&&' && isOpaque(expression.left))
      );
    default:
      return false;
  }
}

/**
 * Whether `node` may have children the linter cannot see: an opaque child
 * expression (`{children}`, `{renderBody()}`), a spread child, a spread
 * attribute (`{...props}` may carry `children`) or an explicit `children` prop.
 */
export function hasOpaqueChildren(node: ESTree.JSXElement): boolean {
  const { attributes } = node.openingElement;
  if (attributes.some((item) => item.type === 'JSXSpreadAttribute')) {
    return true;
  }
  if (attribute(node.openingElement, 'children') !== null) {
    return true;
  }
  return node.children.some(
    (child) =>
      child.type === 'JSXSpreadChild' ||
      (child.type === 'JSXExpressionContainer' &&
        child.expression.type !== 'JSXEmptyExpression' &&
        isOpaque(child.expression)),
  );
}

/** Children that render something: whitespace-only text between tags is dropped. */
export function meaningfulChildren(node: ESTree.JSXElement): ESTree.JSXChild[] {
  return node.children.filter((child) => {
    if (child.type === 'JSXText') {
      return child.value.trim() !== '';
    }
    if (child.type === 'JSXExpressionContainer') {
      return child.expression.type !== 'JSXEmptyExpression';
    }
    return true;
  });
}

/**
 * Like `walkClassExpression`, but a call or tagged template in a `className`
 * is a class position whatever its callee (`cn`, a local `classes()`), so
 * their arguments are walked too.
 */
function walkAttributeClassExpression(
  expression: ESTree.Expression,
  visit: ClassValueVisitor,
): void {
  const inner = unwrapped(expression);
  if (inner !== null) {
    walkAttributeClassExpression(inner, visit);
    return;
  }
  switch (expression.type) {
    case 'ArrayExpression':
      for (const element of expression.elements) {
        if (element !== null && element.type !== 'SpreadElement') {
          walkAttributeClassExpression(element, visit);
        }
      }
      break;
    case 'CallExpression':
      for (const argument of expression.arguments) {
        if (argument.type !== 'SpreadElement') {
          walkAttributeClassExpression(argument, visit);
        }
      }
      break;
    case 'ConditionalExpression':
      walkAttributeClassExpression(expression.consequent, visit);
      walkAttributeClassExpression(expression.alternate, visit);
      break;
    case 'LogicalExpression':
      walkAttributeClassExpression(expression.left, visit);
      walkAttributeClassExpression(expression.right, visit);
      break;
    case 'TaggedTemplateExpression':
      visit({ kind: 'template', node: expression.quasi });
      break;
    default:
      walkClassExpression(expression, visit);
  }
}

/**
 * The static class tokens of an element's `className` / `class` attribute:
 * from the literal, from every static chunk of a template, and from the
 * arguments of any helper call. Interpolated parts are
 * `no-dynamic-class-names`' business and are skipped.
 */
export function classTokensOf(node: ESTree.JSXOpeningElement): ClassToken[] {
  const tokens: ClassToken[] = [];
  const collect: ClassValueVisitor = (value) => {
    for (const group of staticTokenGroups(value)) {
      tokens.push(...group);
    }
  };
  for (const item of node.attributes) {
    if (item.type !== 'JSXAttribute' || !isClassAttribute(item) || item.value === null) {
      continue;
    }
    if (item.value.type === 'Literal') {
      collect({ kind: 'literal', node: item.value });
    } else if (
      item.value.type === 'JSXExpressionContainer' &&
      item.value.expression.type !== 'JSXEmptyExpression'
    ) {
      walkAttributeClassExpression(item.value.expression, collect);
    }
  }
  return tokens;
}
