import { RuleTester } from 'oxlint/plugins-dev';

import { noUnguardedJsonParseRule } from './no-unguarded-json-parse.ts';

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: 'ts' } } });
const error = { messageId: 'unguardedJsonParse' };

tester.run('rm3-node/no-unguarded-json-parse', noUnguardedJsonParseRule, {
  invalid: [
    { code: 'const value = JSON.parse(text);', errors: [error] },
    { code: "const value = JSON['parse'](text);", errors: [error] },
    // Schema validation runs after the parse, so the throw happens first.
    { code: 'const value = schema.safeParse(JSON.parse(row.payload));', errors: [error] },
    // A try in the enclosing function does not guard a callback.
    {
      code: 'try { rows.map((row) => JSON.parse(row.payload)); } catch { /* handled */ }',
      errors: [error],
    },
    // The catch and finally blocks are not covered by their own try.
    {
      code: 'try { read(); } catch (cause) { JSON.parse(fallback); }',
      errors: [error],
    },
    { code: 'try { read(); } finally { JSON.parse(fallback); }', errors: [error] },
    {
      code: 'function load() { return JSON.parse(text); }',
      errors: [error],
    },
  ],
  valid: [
    'try { JSON.parse(text); } catch { /* handled */ }',
    'try { const value = schema.parse(JSON.parse(text)); return value; } catch (cause) { throw new Error("bad", { cause }); }',
    'function load() { try { return JSON.parse(text); } catch { return null; } }',
    // Nested try inside a callback inside a try.
    'try { rows.map((row) => { try { return JSON.parse(row); } catch { return null; } }); } catch { /* handled */ }',
    // Not the global JSON.
    'const JSON = { parse: (text: string) => text }; JSON.parse(text);',
    'function decode(JSON: { parse(text: string): unknown }) { return JSON.parse(text); }',
    'JSON.stringify(value);',
    'parser.parse(text);',
  ],
});
