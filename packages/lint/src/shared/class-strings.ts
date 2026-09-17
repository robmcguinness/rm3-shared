import { memberPropertyName } from '#shared/global-binding.ts';

import type { ESTree } from '@oxlint/plugins';

/**
 * Class-name helpers whose string arguments are Tailwind class lists:
 * shadcn's `cn`, `clsx`, `class-variance-authority`, `tailwind-merge`,
 * `tailwind-variants`. A consumer adds its own through the `callees` option.
 */
export const DEFAULT_CALLEES: readonly string[] = ['cn', 'clsx', 'cva', 'twMerge', 'tv', 'twJoin'];

/** A node found in a class-bearing position. */
export type ClassValue =
  | { kind: 'concat'; node: ESTree.BinaryExpression }
  | { kind: 'literal'; node: ESTree.StringLiteral }
  | { kind: 'template'; node: ESTree.TemplateLiteral };

export type ClassValueVisitor = (value: ClassValue) => void;

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** The string-array option `key`, or `fallback` when the option is absent or malformed. */
export function readStringArrayOption(
  option: unknown,
  key: string,
  fallback: readonly string[],
): readonly string[] {
  if (!isRecord(option)) {
    return fallback;
  }
  const value = option[key];
  if (!Array.isArray(value)) {
    return fallback;
  }
  return value.filter((entry): entry is string => typeof entry === 'string');
}

/** The boolean option `key`, or `fallback` when the option is absent or malformed. */
export function readBooleanOption(option: unknown, key: string, fallback: boolean): boolean {
  if (!isRecord(option)) {
    return fallback;
  }
  const value = option[key];
  return typeof value === 'boolean' ? value : fallback;
}

/**
 * The string option `key` when it is one of `allowed`, or `fallback` when the
 * option is absent, malformed or not an allowed value.
 */
export function readStringOption<const T extends string>(
  option: unknown,
  key: string,
  fallback: T,
  allowed: readonly T[],
): T {
  if (!isRecord(option)) {
    return fallback;
  }
  const value = option[key];
  return allowed.find((entry) => entry === value) ?? fallback;
}

/** The name of `cn(...)` or `styles.cn(...)`, or null for a computed callee. */
export function calleeName(callee: ESTree.Expression): string | null {
  return callee.type === 'Identifier' ? callee.name : memberPropertyName(callee);
}

export function isClassAttribute(node: ESTree.JSXAttribute): boolean {
  return (
    node.name.type === 'JSXIdentifier' &&
    (node.name.name === 'className' || node.name.name === 'class')
  );
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

/** `clsx` and `cva` shapes: string keys are classes, and so may every value be. */
function walkObjectExpression(expression: ESTree.ObjectExpression, visit: ClassValueVisitor): void {
  for (const property of expression.properties) {
    if (property.type !== 'Property') {
      continue;
    }
    const { key } = property;
    if (key.type === 'Literal' && typeof key.value === 'string') {
      visit({ kind: 'literal', node: key });
    } else if (key.type === 'TemplateLiteral') {
      visit({ kind: 'template', node: key });
    }
    walkClassExpression(property.value, visit);
  }
}

/**
 * Visit every string-bearing node inside a class expression: through arrays,
 * object keys and values, ternaries, logical expressions and TypeScript
 * casts. Stops at calls and tagged templates, which get their own visit from
 * the rule's `CallExpression` handler, so a nested `cn(cva(...))` reports
 * each string once.
 */
export function walkClassExpression(
  expression: ESTree.Expression,
  visit: ClassValueVisitor,
  inConcat = false,
): void {
  const inner = unwrapped(expression);
  if (inner !== null) {
    walkClassExpression(inner, visit);
    return;
  }
  switch (expression.type) {
    case 'ArrayExpression':
      for (const element of expression.elements) {
        if (element !== null && element.type !== 'SpreadElement') {
          walkClassExpression(element, visit);
        }
      }
      break;
    case 'BinaryExpression':
      if (expression.operator === '+') {
        // The outermost `+` of a chain stands for the whole chain.
        if (!inConcat) {
          visit({ kind: 'concat', node: expression });
        }
        walkClassExpression(expression.left, visit, true);
        walkClassExpression(expression.right, visit, true);
      }
      break;
    case 'ConditionalExpression':
      walkClassExpression(expression.consequent, visit);
      walkClassExpression(expression.alternate, visit);
      break;
    case 'Literal':
      if (typeof expression.value === 'string') {
        visit({ kind: 'literal', node: expression });
      }
      break;
    case 'LogicalExpression':
      walkClassExpression(expression.left, visit);
      walkClassExpression(expression.right, visit);
      break;
    case 'ObjectExpression':
      walkObjectExpression(expression, visit);
      break;
    case 'TemplateLiteral':
      visit({ kind: 'template', node: expression });
      break;
    default:
  }
}

/**
 * A `callees` option reader for `createOnce`, which runs once per process:
 * the set is rebuilt only when `context.options[0]` changes identity.
 */
export function createCalleeMatcher(readOption: () => unknown): (name: string) => boolean {
  let cachedFor: unknown = Symbol('unset');
  let callees: ReadonlySet<string> = new Set(DEFAULT_CALLEES);
  return (name) => {
    const option = readOption();
    if (option !== cachedFor) {
      cachedFor = option;
      callees = new Set(readStringArrayOption(option, 'callees', DEFAULT_CALLEES));
    }
    return callees.has(name);
  };
}

export interface ClassToken {
  /** The node to report on: the string literal or the template chunk holding the token. */
  node: ESTree.Node;
  token: string;
}

/**
 * The static class tokens of a class value, grouped by string: one group for
 * a literal, one per static chunk of a template. A `+` chain yields nothing
 * here; its operands are visited on their own.
 */
export function staticTokenGroups(value: ClassValue): ClassToken[][] {
  if (value.kind === 'literal') {
    const { node } = value;
    return [splitClassTokens(node.value).map((token) => ({ node, token }))];
  }
  if (value.kind === 'template') {
    return value.node.quasis.map((quasi) =>
      splitClassTokens(quasiText(quasi)).map((token) => ({ node: quasi, token })),
    );
  }
  return [];
}

/** The operands of a left-associative `+` chain, in source order. */
export function concatOperands(node: ESTree.Expression): ESTree.Expression[] {
  if (node.type === 'BinaryExpression' && node.operator === '+') {
    return [...concatOperands(node.left), ...concatOperands(node.right)];
  }
  return [node];
}

/** Visit the value of a `className` or `class` JSX attribute. */
export function visitClassAttribute(node: ESTree.JSXAttribute, visit: ClassValueVisitor): void {
  if (!isClassAttribute(node) || node.value === null) {
    return;
  }
  if (node.value.type === 'Literal') {
    visit({ kind: 'literal', node: node.value });
  } else if (
    node.value.type === 'JSXExpressionContainer' &&
    node.value.expression.type !== 'JSXEmptyExpression'
  ) {
    walkClassExpression(node.value.expression, visit);
  }
}

/**
 * The visitor both Tailwind rules share: JSX class attributes, arguments to
 * the configured class helpers, and templates tagged with one of them.
 */
export function createClassValueVisitor(
  isCallee: (name: string) => boolean,
  visit: ClassValueVisitor,
): {
  CallExpression(node: ESTree.CallExpression): void;
  JSXAttribute(node: ESTree.JSXAttribute): void;
  TaggedTemplateExpression(node: ESTree.TaggedTemplateExpression): void;
} {
  return {
    CallExpression(node) {
      const name = calleeName(node.callee);
      if (name === null || !isCallee(name)) {
        return;
      }
      for (const argument of node.arguments) {
        if (argument.type !== 'SpreadElement') {
          walkClassExpression(argument, visit);
        }
      }
    },
    JSXAttribute(node) {
      visitClassAttribute(node, visit);
    },
    TaggedTemplateExpression(node) {
      const name = calleeName(node.tag);
      if (name !== null && isCallee(name)) {
        visit({ kind: 'template', node: node.quasi });
      }
    },
  };
}

function splitClassTokens(value: string): string[] {
  return value.split(/\s+/).filter(Boolean);
}

/** The text of a template chunk; `cooked` is null for an invalid escape. */
function quasiText(element: ESTree.TemplateElement): string {
  return element.value.cooked ?? element.value.raw;
}

/** Index of the last `char` outside `[...]` and `(...)`, or -1. */
function lastTopLevelIndex(text: string, char: string): number {
  let depth = 0;
  let index = -1;
  for (let i = 0; i < text.length; i += 1) {
    const current = text[i];
    if (current === '[' || current === '(') {
      depth += 1;
    } else if (current === ']' || current === ')') {
      depth = Math.max(0, depth - 1);
    } else if (current === char && depth === 0) {
      index = i;
    }
  }
  return index;
}

/**
 * The variant chain of a class token, colon included: `md:hover:` for
 * `md:hover:w-4`, `` for a bare `w-4`. Same split as `utilityOf`.
 */
export function variantPrefixOf(token: string): string {
  return token.slice(0, lastTopLevelIndex(token, ':') + 1);
}

/** Whether a `dark:` variant sits anywhere in the token's variant chain. */
export function hasDarkVariant(token: string): boolean {
  return variantPrefixOf(token).split(':').includes('dark');
}

/**
 * The utility of a class token with its variants, important marker, negative
 * sign and modifier stripped: `data-[state=open]:hover:!-mt-[1px]/50` is
 * `mt-[1px]`. Variant brackets may hold colons (`supports-[display:grid]:`),
 * so the split is on the last colon at bracket depth zero.
 */
export function utilityOf(token: string): string {
  let utility = token.slice(lastTopLevelIndex(token, ':') + 1);
  if (utility.startsWith('!')) {
    utility = utility.slice(1);
  }
  if (utility.endsWith('!')) {
    utility = utility.slice(0, -1);
  }
  if (utility.startsWith('-')) {
    utility = utility.slice(1);
  }
  const modifier = lastTopLevelIndex(utility, '/');
  if (modifier > 0) {
    utility = utility.slice(0, modifier);
  }
  return utility;
}
