import { RuleTester } from 'oxlint/plugins-dev';

import { noCallbackHooksRule } from './no-callback-hooks.ts';

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: 'ts' } } });
const callback = { messageId: 'callbackHook' };
const mixed = { messageId: 'mixedHook' };

tester.run('rm3-fastify/no-callback-hooks', noCallbackHooksRule, {
  invalid: [
    {
      code: "app.addHook('onRequest', (request, reply, done) => { done(); });",
      errors: [callback],
    },
    { code: "app.addHook('onClose', (instance, done) => { done(); });", errors: [callback] },
    { code: "app.addHook('onReady', function (done) { done(); });", errors: [callback] },
    {
      code: "app.addHook('preSerialization', (request, reply, payload, done) => { done(null, payload); });",
      errors: [callback],
    },
    {
      code: "app.addHook('onSend', function (this: FastifyInstance, request, reply, payload, done) { done(null, payload); });",
      errors: [callback],
    },
    { code: 'fastify.addHook(`onRequest`, (request, reply, done) => done());', errors: [callback] },
    {
      code: "app.addHook('onRequest', async (request, reply, done) => { done(); });",
      errors: [mixed],
    },
    {
      code: "app.get('/', { preHandler: (request, reply, done) => { done(); } }, handler);",
      errors: [callback],
    },
    {
      code: "app.route({ url: '/', method: 'GET', handler, preHandler: [auth, (request, reply, done) => { done(); }] });",
      errors: [callback],
    },
  ],
  valid: [
    "app.addHook('onRequest', async (request, reply) => { request.startedAt = Date.now(); });",
    "app.addHook('onRequest', async function limitPairing(request, reply) { await limiter.call(this, request, reply); });",
    "app.addHook('onClose', async () => { await closeDb(); });",
    "app.addHook('onClose', async (instance) => { await instance.db.close(); });",
    "app.addHook('preSerialization', async (request, reply, payload) => payload);",
    "app.addHook('onSend', async function (this: FastifyInstance, request, reply, payload) { return payload; });",
    // A sync hook at the async arity returns nothing and is fine.
    "app.addHook('onResponse', (request, reply) => { metrics.observe(reply.elapsedTime); });",
    // `onRoute` and `onRegister` are synchronous by design.
    "app.addHook('onRoute', (routeOptions) => { routeOptions.config ??= {}; });",
    "app.addHook('onRegister', (instance, options) => { instance.decorate('x', options.x); });",
    // A reference cannot be inspected here.
    "app.addHook('onRequest', securityHook);",
    // Not a hook name Fastify knows, or not a hook call at all.
    "app.addHook('onWhatever', (a, b, c, d, e) => {});",
    'app.addHook(hookName, (request, reply, done) => done());',
    "app.addContentTypeParser('*', (request, payload, done) => done(null));",
    // Route options: async forms and non-hook keys.
    "app.get('/', { preHandler: async (request, reply) => {} }, handler);",
    "app.route({ url: '/', method: 'GET', handler, onSend: [async (request, reply, payload) => payload] });",
    "app.get('/', { config: { retry: (a, b, c) => {} } }, handler);",
    'const options = { preHandler: (request, reply, done) => done() };',
  ],
});
