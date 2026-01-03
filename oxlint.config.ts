import { antiSlopRulesOff, rm3Config } from '@rm3/oxlint-config';
import { defineConfig } from 'oxlint';

export default defineConfig({
  // `extends` merges: this file only adds to the shared preset, last wins.
  extends: [rm3Config],
  // Everything in this repo runs in Node.
  env: { node: true },
  overrides: [
    {
      // The plugin inspects ASTs with `typeof` and `unknown` by necessity; it
      // cannot pass its own rules. Every other shared rule still applies to it.
      files: ['packages/lint/**'],
      rules: { ...antiSlopRulesOff },
    },
  ],
});
