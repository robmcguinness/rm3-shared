import { RuleTester } from 'oxlint/plugins-dev';

import { noLogInLoopRule } from './no-log-in-loop.ts';

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: 'ts' } } });
const error = { messageId: 'logInLoop' };

tester.run('rm3-node/no-log-in-loop', noLogInLoopRule, {
  invalid: [
    {
      code: "for (const item of items) { log.info({ item }, 'processing item'); }",
      errors: [error],
    },
    {
      code: "for (let i = 0; i < n; i++) { logger.debug({ i }, 'tick'); }",
      errors: [error],
    },
    {
      code: "for (const key in map) { request.log.warn({ key }, 'unknown key'); }",
      errors: [error],
    },
    { code: "while (queue.length > 0) { app.log.info('draining'); }", errors: [error] },
    { code: "do { this.log.trace('poll'); } while (pending());", errors: [error] },
    {
      code: "async function f() { for await (const chunk of stream) { log.debug({ size: chunk.length }, 'chunk'); } }",
      errors: [error],
    },
    {
      code: "for (const bookmark of bookmarks) { try { await save(bookmark); } catch (error) { getLog().warn({ err: error, url: bookmark.url }, 'could not convert a legacy bookmark'); } }",
      errors: [error],
    },
    {
      code: "for (const duplicate of index.duplicates) { if (!seen.has(duplicate.key)) { getLog().warn({ ...duplicate }, 'duplicate clip URL'); } }",
      errors: [error],
    },
    {
      code: "async function run() { for (const row of rows) { log.error({ row }, 'bad row'); } }",
      errors: [error],
    },
    {
      code: "app.get('/x', async (request) => { for (const id of ids) { request.log.info({ id }, 'x'); } })",
      errors: [error],
    },
    {
      code: "for (const x of xs) { switch (x.kind) { case 'a': log.info('a'); break; } }",
      errors: [error],
    },
    {
      code: "for (const a of as) { for (const b of bs) { log.info({ a, b }, 'pair'); } }",
      errors: [error],
    },
    { code: "for (const item of items) log.info({ item }, 'x');", errors: [error] },
  ],
  valid: [
    "for (const item of items) { count += 1; } log.info({ count }, 'items processed');",
    "for (const item of items) { items.forEach((other) => log.debug({ other }, 'x')); }",
    "for (const item of items) { queue.on('done', () => { log.info('done'); }); }",
    "for (const item of items) { async function flush() { log.info('flushed'); } }",
    "items.forEach((item) => log.info({ item }, 'x'));",
    "items.map((item) => { log.info({ item }, 'x'); return item; });",
    "while (log.info('tick')) {}",
    "for (let i = 0; log.info('x'); i++) {}",
    'for (const item of items) { console.log(item); }',
    'for (const item of items) { metrics.info(item); }',
    "for (const item of items) { logger.child({ item }).info('x'); }",
  ],
});
