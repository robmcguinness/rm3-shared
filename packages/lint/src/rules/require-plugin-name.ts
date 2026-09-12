import { defineRule } from '@oxlint/plugins';

import { isImportedFrom, objectPropertyName } from '#shared/global-binding.ts';

import type { ESTree } from '@oxlint/plugins';

const fastifyPluginModules = new Set(['fastify-plugin']);
const fastifyPluginBindings = new Set(['default', 'fastifyPlugin']);

/** Whether the options literal has a `name` key; a spread may carry one, so it counts as named. */
function isNamed(options: ESTree.ObjectExpression): boolean {
  return options.properties.some(
    (property) => property.type === 'SpreadElement' || objectPropertyName(property) === 'name',
  );
}

/** Report `fp(plugin)` calls whose options carry no `name`. */
export const requirePluginNameRule = defineRule({
  createOnce(context) {
    return {
      CallExpression(node) {
        if (
          !isImportedFrom(
            context.sourceCode,
            node.callee,
            fastifyPluginModules,
            fastifyPluginBindings,
          )
        ) {
          return;
        }
        const [, options] = node.arguments;
        if (options === undefined) {
          context.report({ messageId: 'unnamedPlugin', node });
          return;
        }
        // The legacy `fp(plugin, '5.x')` form has nowhere to put a name.
        if (options.type === 'Literal' && typeof options.value === 'string') {
          context.report({ messageId: 'unnamedPlugin', node: options });
          return;
        }
        if (options.type === 'ObjectExpression' && !isNamed(options)) {
          context.report({ messageId: 'unnamedPlugin', node: options });
        }
      },
    };
  },
  meta: {
    docs: {
      description:
        'Require a name on every fastify-plugin wrapper; Fastify uses it for dependencies, duplicate detection and error messages.',
    },
    messages: {
      unnamedPlugin:
        "Give this plugin a `name` in the fastify-plugin options (`fp(plugin, { name: 'my-plugin' })`). Fastify resolves `dependencies` by name, refuses to register a named plugin twice, and names it in errors; an unnamed plugin gets none of that.",
    },
    type: 'suggestion',
  },
});
