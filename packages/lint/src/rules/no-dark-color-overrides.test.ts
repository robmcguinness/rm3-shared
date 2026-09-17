import { RuleTester } from 'oxlint/plugins-dev';

import { noDarkColorOverridesRule } from './no-dark-color-overrides.ts';

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: 'tsx' } } });
const error = { messageId: 'darkOverride' };

tester.run('rm3-shadcn/no-dark-color-overrides', noDarkColorOverridesRule, {
  invalid: [
    { code: '<div className="bg-white dark:bg-gray-950" />', errors: [error] },
    { code: '<p className="dark:text-white" />', errors: [error] },
    { code: '<div className="dark:hover:border-zinc-800" />', errors: [error] },
    { code: '<div className="md:dark:bg-black/50" />', errors: [error] },
    { code: '<div className={`dark:bg-slate-900 ${extra}`} />', errors: [error] },
    { code: "cn('dark:bg-gray-900', className);", errors: [error] },
    {
      code: '<div className="dark:bg-success/20" />',
      errors: [error],
      options: [{ strict: true }],
    },
    {
      code: '<div className="dark:text-foreground" />',
      errors: [error],
      options: [{ strict: true }],
    },
  ],
  valid: [
    '<div className="bg-background text-foreground" />',
    // A semantic token under dark: is a theme tweak, not a hard-coded color.
    '<div className="bg-success/10 dark:bg-success/20" />',
    '<div className="dark:border-border" />',
    // Non-color utilities under dark: are fine.
    '<div className="dark:opacity-80 dark:shadow-none dark:invert" />',
    // Palette colors without dark: belong to `shadcn/no-raw-colors`.
    '<div className="bg-gray-950" />',
    '<div className="dark:bg-[#111]" />',
    // Not a class position.
    "const tone = 'dark:bg-gray-950';",
  ],
});
