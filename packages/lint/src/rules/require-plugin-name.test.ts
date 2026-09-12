import { RuleTester } from 'oxlint/plugins-dev';

import { requirePluginNameRule } from './require-plugin-name.ts';

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: 'ts' } } });
const error = { messageId: 'unnamedPlugin' };

tester.run('rm3-fastify/require-plugin-name', requirePluginNameRule, {
  invalid: [
    {
      code: "import fp from 'fastify-plugin'; export default fp(async (app) => {});",
      errors: [error],
    },
    { code: "import fp from 'fastify-plugin'; export default fp(plugin, {});", errors: [error] },
    {
      code: "import fp from 'fastify-plugin'; export default fp(plugin, { dependencies: ['state'] });",
      errors: [error],
    },
    { code: "import fp from 'fastify-plugin'; export default fp(plugin, '5.x');", errors: [error] },
    {
      code: "import fp from 'fastify-plugin'; export default fp<Options>((app, options, done) => { done(); }, { fastify: '5.x' });",
      errors: [error],
    },
    { code: "import plugin from 'fastify-plugin'; export default plugin(fn);", errors: [error] },
    {
      code: "import { fastifyPlugin } from 'fastify-plugin'; export default fastifyPlugin(fn);",
      errors: [error],
    },
  ],
  valid: [
    "import fp from 'fastify-plugin'; export default fp(plugin, { name: 'machdown-state' });",
    "import fp from 'fastify-plugin'; export default fp<Options>(plugin, { dependencies: ['machdown-state'], name: 'machdown-auth' });",
    "import fp from 'fastify-plugin'; export default fp(plugin, { 'name': 'x' });",
    // Opaque options cannot be judged here; a spread may carry the name.
    "import fp from 'fastify-plugin'; export default fp(plugin, options);",
    "import fp from 'fastify-plugin'; export default fp(plugin, { ...base, dependencies: [] });",
    // Not fastify-plugin.
    "import fp from './fp.ts'; export default fp(plugin);",
    'const fp = (plugin) => plugin; export default fp(plugin);',
    "import fp from 'fastify-plugin'; const wrapped = other(plugin);",
  ],
});
