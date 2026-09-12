import { defineRule } from '@oxlint/plugins';

import {
  HOOK_SIGNATURES,
  isObjectProperty,
  routeOptionName,
  runtimeParameterCount,
  stringArgument,
} from '#shared/fastify-handlers.ts';
import { isFunctionNode } from '#shared/functions.ts';
import { memberPropertyName } from '#shared/global-binding.ts';

import type { Context, ESTree } from '@oxlint/plugins';

/** Each hook value in `{ preHandler: [a, b] }` or `{ preHandler: fn }`. */
function hookValues(value: ESTree.Expression): ESTree.Node[] {
  if (value.type !== 'ArrayExpression') {
    return [value];
  }
  return value.elements.filter((element) => element !== null);
}

/** Report a hook function that takes more parameters than its async signature: the extra one is `done`. */
function checkHook(context: Context, hook: string, value: ESTree.Node): void {
  const signature = HOOK_SIGNATURES.get(hook);
  if (signature === undefined || !isFunctionNode(value)) {
    return;
  }
  if (runtimeParameterCount(value) <= signature.length) {
    return;
  }
  context.report({
    data: { hook, signature: signature.join(', ') },
    messageId: value.async ? 'mixedHook' : 'callbackHook',
    node: value,
  });
}

/** Report `addHook` and route-level hooks written in the callback (`done`) style. */
export const noCallbackHooksRule = defineRule({
  createOnce(context) {
    return {
      CallExpression(node) {
        if (memberPropertyName(node.callee) !== 'addHook') {
          return;
        }
        const hook = stringArgument(node.arguments[0]);
        const [, fn] = node.arguments;
        if (hook !== null && fn !== undefined) {
          checkHook(context, hook, fn);
        }
      },
      Property(node) {
        if (!isObjectProperty(node)) {
          return;
        }
        const hook = routeOptionName(node);
        if (hook === null) {
          return;
        }
        for (const value of hookValues(node.value)) {
          checkHook(context, hook, value);
        }
      },
    };
  },
  meta: {
    docs: {
      description:
        'Disallow the callback (done) form of Fastify hooks; async hooks are the documented signature and mixing the two runs the chain twice.',
    },
    messages: {
      callbackHook:
        'Write the `{{hook}}` hook as `async ({{signature}}) => { ... }` and drop `done`. Fastify resolves the returned promise; the callback signature is the legacy form the docs steer away from.',
      mixedHook:
        'This `{{hook}}` hook is async and also takes `done`. Fastify continues once for the promise and once for the callback, so the chain runs twice; remove the `done` parameter.',
    },
    type: 'problem',
  },
});
