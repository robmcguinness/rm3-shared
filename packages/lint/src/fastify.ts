import { eslintCompatPlugin } from '@oxlint/plugins';

import { noCallbackHooksRule } from './rules/no-callback-hooks.ts';
import { noDefaultRequestLoggingRule } from './rules/no-default-request-logging.ts';
import { requireGenReqIdRule } from './rules/require-gen-req-id.ts';
import { requirePluginNameRule } from './rules/require-plugin-name.ts';
import { returnReplyRule } from './rules/return-reply.ts';

/**
 * Fastify rules from the `fastify-best-practices` skill, for the practices a
 * linter can decide from the call shape alone. A separate plugin from
 * `rm3-node` because the rules key on Fastify's API (`addHook`, `fp`, the
 * handler signature) rather than on Node.
 */
const rm3FastifyPlugin = eslintCompatPlugin({
  meta: { name: 'rm3-fastify' },
  rules: {
    'no-callback-hooks': noCallbackHooksRule,
    'no-default-request-logging': noDefaultRequestLoggingRule,
    'require-gen-req-id': requireGenReqIdRule,
    'require-plugin-name': requirePluginNameRule,
    'return-reply': returnReplyRule,
  },
});

export default rm3FastifyPlugin;

// A variable type annotation (not a cast) for the same reason as
// `antiSlopRules`: every value stays the literal `'error'` while the object
// remains the mutable shape oxlint's `Config['rules']` accepts.
export const fastifyCustomRules: {
  'rm3-fastify/no-callback-hooks': 'error';
  'rm3-fastify/no-default-request-logging': 'error';
  'rm3-fastify/require-gen-req-id': 'error';
  'rm3-fastify/require-plugin-name': 'error';
  'rm3-fastify/return-reply': 'error';
} = {
  // hooks.md: async hooks; the `done` form is legacy and mixing runs the chain twice.
  'rm3-fastify/no-callback-hooks': 'error',
  // logging-best-practices wide-events.md: one event per request from onResponse, not Fastify's two default lines.
  'rm3-fastify/no-default-request-logging': 'error',
  // logging-best-practices wide-events.md: a UUID request id; the default counter restarts at 1 on every boot.
  'rm3-fastify/require-gen-req-id': 'error',
  // plugins.md: `dependencies` resolve by name, so every `fp()` gets one.
  'rm3-fastify/require-plugin-name': 'error',
  // routes.md / hooks.md: `return reply.send(...)` in an async handler or hook.
  'rm3-fastify/return-reply': 'error',
};
