import { defineRule } from '@oxlint/plugins';

import { isGlobalIdentifier, isImportedFrom, memberPropertyName } from '#shared/global-binding.ts';

import type { ESTree, SourceCode } from '@oxlint/plugins';

const listenerMethods = new Set([
  'addListener',
  'on',
  'once',
  'prependListener',
  'prependOnceListener',
]);

const shutdownEvents = new Set([
  'SIGHUP',
  'SIGINT',
  'SIGTERM',
  'uncaughtException',
  'unhandledRejection',
]);

const processModules = new Set(['node:process', 'process']);
const processBindings = new Set(['default', 'process']);

function isProcess(sourceCode: SourceCode, expression: ESTree.Expression): boolean {
  return (
    isGlobalIdentifier(sourceCode, expression, 'process') ||
    isImportedFrom(sourceCode, expression, processModules, processBindings)
  );
}

function eventName(argument: ESTree.Argument | undefined): string | null {
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

/** Report `process.on('SIGTERM', ...)` and friends; close-with-grace owns shutdown signals. */
export const noManualSignalHandlersRule = defineRule({
  createOnce(context) {
    return {
      CallExpression(node) {
        const { callee } = node;
        if (callee.type !== 'MemberExpression') {
          return;
        }
        const method = memberPropertyName(callee);
        if (method === null || !listenerMethods.has(method)) {
          return;
        }
        if (!isProcess(context.sourceCode, callee.object)) {
          return;
        }
        const event = eventName(node.arguments[0]);
        if (event !== null && shutdownEvents.has(event)) {
          context.report({ data: { event }, messageId: 'manualSignalHandler', node });
        }
      },
    };
  },
  meta: {
    docs: {
      description:
        'Disallow hand-written process listeners for shutdown signals and fatal errors; use close-with-grace.',
    },
    messages: {
      manualSignalHandler:
        "Replace the `process` listener for '{{event}}' with `closeWithGrace` from 'close-with-grace'. It handles SIGTERM, SIGINT, uncaughtException and unhandledRejection together, with a delay and a single cleanup path.",
    },
    type: 'problem',
  },
});
