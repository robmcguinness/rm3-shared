import { RuleTester } from 'oxlint/plugins-dev';

import { returnReplyRule } from './return-reply.ts';

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: 'ts' } } });
const error = { messageId: 'bareReply' };

tester.run('rm3-fastify/return-reply', returnReplyRule, {
  invalid: [
    {
      code: "app.get('/', async (request, reply) => { reply.send({ ok: true }); });",
      errors: [error],
    },
    {
      code: "app.addHook('onRequest', async (request, reply) => { if (!request.user) { reply.code(401).send({ error: 'unauthorized' }); } });",
      errors: [error],
    },
    {
      code: "app.route({ method: 'GET', url: '/*', async handler(request, reply) { const { matched } = await handle(request, reply); if (!matched) { reply.status(404).send({ error: 'Not Found' }); } } });",
      errors: [error],
    },
    {
      code: "app.get('/', { preHandler: [async (request, reply) => { reply.redirect('/login'); }] }, handler);",
      errors: [error],
    },
    {
      code: 'app.setErrorHandler(async (error, request, reply) => { reply.code(500).send({ error: error.message }); });',
      errors: [error],
    },
    {
      code: 'app.setNotFoundHandler(async (request, reply) => { reply.callNotFound(); });',
      errors: [error],
    },
    {
      code: "import type { FastifyReply, FastifyRequest } from 'fastify'; export const securityHook = async (request: FastifyRequest, reply: FastifyReply) => { reply.code(403).send({ error: 'forbidden' }); };",
      errors: [error],
    },
    {
      code: "app.get('/', async function (request, reply) { reply['send']({ ok: true }); });",
      errors: [error],
    },
    {
      code: "app.get('/', async (request, res) => { res.type('text/html').sendFile('index.html'); });",
      errors: [error],
    },
  ],
  valid: [
    "app.get('/', async (request, reply) => { return reply.send({ ok: true }); });",
    "app.get('/', async (request, reply) => reply.send({ ok: true }));",
    "app.get('/', async (request, reply) => { await reply.type('application/json').send(body); });",
    "app.addHook('onRequest', async (request, reply) => { if (!request.user) { return reply.code(401).send({ error: 'unauthorized' }); } });",
    "app.route({ url: '/*', async handler(request, reply) { if (!matched) { return reply.callNotFound(); } } });",
    // Returning the payload is the primary form.
    "app.get('/', async () => ({ status: 'ok' }));",
    // A sync handler is where an explicit send belongs.
    "app.get('/', (request, reply) => { reply.send({ ok: true }); });",
    "app.addHook('onRequest', (request, reply, done) => { reply.code(401).send({}); done(); });",
    // `code`, `header` and `type` only stage the response.
    "app.get('/', async (request, reply) => { reply.header('x-id', request.id); return { ok: true }; });",
    // Inside a nested callback the statement is not the handler's own; the fix there is `return reply` from the handler.
    "app.get('/', async (request, reply) => { stream.on('end', () => { reply.send(buffer); }); return reply; });",
    // Not a Fastify handler: no registrar, no property key, no Fastify parameter type.
    'export const handler = async (req, res) => { res.send({ ok: true }); };',
    'export async function handler(req, res) { res.send({ ok: true }); }',
    // A local named `reply` is not the handler's parameter.
    "app.get('/', async (request) => { const reply = createReply(); reply.send({ ok: true }); return null; });",
    // A closure over an outer `reply` is a different function's problem.
    "app.get('/', async (request, reply) => { const send = async () => { reply.send({ ok: true }); }; await send(); return reply; });",
    // Route-option keys outside the handler set are not handlers.
    "app.get('/', { config: { async run(request, reply) { reply.send(1); } } }, handler);",
  ],
});
