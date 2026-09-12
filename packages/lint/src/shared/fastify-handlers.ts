import { memberPropertyName, objectPropertyName } from '#shared/global-binding.ts';
import { isFunctionNode, type FunctionNode } from '#shared/functions.ts';

import type { ESTree } from '@oxlint/plugins';

/** Route-registering methods on a Fastify instance. */
export const ROUTE_METHODS: ReadonlySet<string> = new Set([
  'all',
  'delete',
  'get',
  'head',
  'options',
  'patch',
  'post',
  'put',
  'route',
]);

/**
 * The async signature of each hook. The callback form appends `done`, so a
 * function with more parameters than this is using it. `onRoute` and
 * `onRegister` are synchronous by design and absent here.
 */
export const HOOK_SIGNATURES: ReadonlyMap<string, readonly string[]> = new Map([
  ['onClose', ['instance']],
  ['onError', ['request', 'reply', 'error']],
  ['onListen', []],
  ['onReady', []],
  ['onRequest', ['request', 'reply']],
  ['onRequestAbort', ['request']],
  ['onResponse', ['request', 'reply']],
  ['onSend', ['request', 'reply', 'payload']],
  ['onTimeout', ['request', 'reply']],
  ['preClose', []],
  ['preHandler', ['request', 'reply']],
  ['preParsing', ['request', 'reply', 'payload']],
  ['preSerialization', ['request', 'reply', 'payload']],
  ['preValidation', ['request', 'reply']],
]);

/**
 * Instance methods whose function argument is a handler or hook. Matched by
 * name only: `router.get(url, fn)` on an Express router looks the same, and
 * without types there is nothing to tell them apart.
 */
const HANDLER_REGISTRARS: ReadonlySet<string> = new Set([
  ...ROUTE_METHODS,
  'addHook',
  'setErrorHandler',
  'setNotFoundHandler',
]);

/** Route-option keys whose value is a handler or hook (`{ handler, preHandler: [...] }`). */
const HANDLER_PROPERTIES: ReadonlySet<string> = new Set([
  'errorHandler',
  'handler',
  ...HOOK_SIGNATURES.keys(),
]);

/** A parameter annotated with one of these is a Fastify handler wherever it lives. */
const FASTIFY_PARAMETER_TYPES: ReadonlySet<string> = new Set(['FastifyReply', 'FastifyRequest']);

/** The nearest function the node sits in, or null at module level. */
export function enclosingFunction(node: ESTree.Node): FunctionNode | null {
  let current: ESTree.Node | null = node.parent;
  while (current !== null && current.type !== 'Program') {
    if (isFunctionNode(current)) {
      return current;
    }
    current = current.parent;
  }
  return null;
}

/** A string literal or expression-free template argument, or null when it is dynamic. */
export function stringArgument(argument: ESTree.Argument | undefined): string | null {
  if (argument === undefined) {
    return null;
  }
  if (argument.type === 'Literal' && typeof argument.value === 'string') {
    return argument.value;
  }
  if (argument.type === 'TemplateLiteral' && argument.expressions.length === 0) {
    return argument.quasis[0]?.value.cooked ?? null;
  }
  return null;
}

/** Parameters minus a TypeScript `this` annotation, which is not a runtime argument. */
export function runtimeParameterCount(fn: FunctionNode): number {
  return fn.params.filter(
    (parameter) => !(parameter.type === 'Identifier' && parameter.name === 'this'),
  ).length;
}

function isHandlerRegistrar(call: ESTree.CallExpression): boolean {
  const name = memberPropertyName(call.callee);
  return name !== null && HANDLER_REGISTRARS.has(name);
}

/** A key/value pair of an object literal, as opposed to a destructuring pattern's. */
export function isObjectProperty(node: ESTree.Node): node is ESTree.ObjectProperty {
  return node.type === 'Property' && node.parent?.type === 'ObjectExpression';
}

/**
 * The route-option property a function is the value of, looking through one
 * array (`preHandler: [a, b]`), or null when it is not a property value.
 */
function optionProperty(node: ESTree.Node): ESTree.ObjectProperty | null {
  const holder = node.parent?.type === 'ArrayExpression' ? node.parent : node;
  const { parent } = holder;
  return parent !== null && isObjectProperty(parent) && parent.value === holder ? parent : null;
}

/**
 * The hook or handler name a route-option property carries, when its object
 * is passed to a route registrar: `app.route({ handler })`,
 * `app.get(url, { preHandler: [auth] }, fn)`. Null for any other property.
 */
export function routeOptionName(property: ESTree.ObjectProperty): string | null {
  const name = objectPropertyName(property);
  if (name === null || !HANDLER_PROPERTIES.has(name)) {
    return null;
  }
  const call = property.parent.parent;
  return call?.type === 'CallExpression' && isHandlerRegistrar(call) ? name : null;
}

function hasFastifyParameterType(parameter: ESTree.ParamPattern): boolean {
  const annotation =
    parameter.type === 'TSParameterProperty'
      ? parameter.parameter.typeAnnotation
      : parameter.typeAnnotation;
  const type = annotation?.typeAnnotation;
  return (
    type?.type === 'TSTypeReference' &&
    type.typeName.type === 'Identifier' &&
    FASTIFY_PARAMETER_TYPES.has(type.typeName.name)
  );
}

/**
 * Whether a function is a Fastify route handler or hook: passed straight to a
 * registrar (`app.get(url, fn)`, `addHook(name, fn)`), sitting under a
 * handler key in route options, or typed with `FastifyRequest`/`FastifyReply`
 * so it can be registered from anywhere.
 */
export function isFastifyHandler(fn: FunctionNode): boolean {
  const { parent } = fn;
  if (parent.type === 'CallExpression' && isHandlerRegistrar(parent)) {
    return parent.arguments.some((argument) => argument === fn);
  }
  const property = optionProperty(fn);
  if (property !== null && routeOptionName(property) !== null) {
    return true;
  }
  return fn.params.some(hasFastifyParameterType);
}
