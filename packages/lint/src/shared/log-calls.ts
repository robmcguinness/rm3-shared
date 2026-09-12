import { memberPropertyName } from '#shared/global-binding.ts';

import type { ESTree } from '@oxlint/plugins';

const LOG_LEVELS: ReadonlySet<string> = new Set([
  'debug',
  'error',
  'fatal',
  'info',
  'trace',
  'warn',
]);

/** Bare identifiers that hold a pino logger by convention (`@rm3/logger` exports `logger`). */
const LOGGER_NAMES: ReadonlySet<string> = new Set(['log', 'logger']);

/** Functions that return the logger: machdown's `getLog()`, openmint's `getLogger(context)`. */
const LOGGER_GETTERS: ReadonlySet<string> = new Set(['getLog', 'getLogger']);

/**
 * Whether an expression evaluates to a pino logger by convention: a bare
 * `log` / `logger`, an `x.log` member, a `getLog()` / `getLogger(ctx)` call,
 * or a `??` / `||` with a logger on either side (`getLogger(ctx) ?? logger`).
 */
function isLoggerExpression(expression: ESTree.Expression): boolean {
  if (expression.type === 'Identifier') {
    return LOGGER_NAMES.has(expression.name);
  }
  if (expression.type === 'MemberExpression') {
    return memberPropertyName(expression) === 'log';
  }
  if (expression.type === 'CallExpression') {
    return expression.callee.type === 'Identifier' && LOGGER_GETTERS.has(expression.callee.name);
  }
  if (expression.type === 'LogicalExpression' && expression.operator !== '&&') {
    return isLoggerExpression(expression.left) || isLoggerExpression(expression.right);
  }
  return false;
}

/**
 * The level of a pino-shaped log call, or null: `request.log.info(...)`,
 * `app.log.error(...)`, `this.log.warn(...)`, `logger.debug(...)`,
 * `getLog().info(...)`, `(getLogger(ctx) ?? logger).error(...)`.
 * `console.error` and `metrics.error` do not match; neither does a
 * `.child()` result, which cannot be told apart from any other call.
 */
export function logLevelOf(call: ESTree.CallExpression): string | null {
  const { callee } = call;
  if (callee.type !== 'MemberExpression') {
    return null;
  }
  const level = memberPropertyName(callee);
  if (level === null || !LOG_LEVELS.has(level)) {
    return null;
  }
  return isLoggerExpression(callee.object) ? level : null;
}

/**
 * pino's signature is `(mergingObject?, message?, ...args)`: the message is
 * the first argument unless that is an object literal, then the second.
 */
export function logMessageArgument(call: ESTree.CallExpression): ESTree.Argument | undefined {
  const [first, second] = call.arguments;
  return first?.type === 'ObjectExpression' ? second : first;
}
