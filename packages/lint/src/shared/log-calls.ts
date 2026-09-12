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

/**
 * The level of a pino-shaped log call, or null: `request.log.info(...)`,
 * `app.log.error(...)`, `this.log.warn(...)`, `logger.debug(...)`.
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
  const { object } = callee;
  if (object.type === 'Identifier') {
    return LOGGER_NAMES.has(object.name) ? level : null;
  }
  return memberPropertyName(object) === 'log' ? level : null;
}

/**
 * pino's signature is `(mergingObject?, message?, ...args)`: the message is
 * the first argument unless that is an object literal, then the second.
 */
export function logMessageArgument(call: ESTree.CallExpression): ESTree.Argument | undefined {
  const [first, second] = call.arguments;
  return first?.type === 'ObjectExpression' ? second : first;
}
