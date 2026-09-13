import { RuleTester } from 'oxlint/plugins-dev';

import { noPaletteColorsRule } from './no-palette-colors.ts';

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: 'tsx' } } });
const error = { messageId: 'paletteColor' };

tester.run('rm3-shadcn/no-palette-colors', noPaletteColorsRule, {
  invalid: [
    { code: '<div className="bg-blue-500 text-white" />', errors: [error, error] },
    { code: '<p className="text-gray-600" />', errors: [error] },
    { code: '<span className="text-emerald-600" />', errors: [error] },
    { code: '<span className="text-red-600/80" />', errors: [error] },
    { code: '<div className="border-x-zinc-950" />', errors: [error] },
    { code: '<div className="hover:bg-slate-50" />', errors: [error] },
    {
      code: '<div className="ring-black shadow-stone-200 fill-rose-400" />',
      errors: [error, error, error],
    },
    { code: '<div className="from-sky-500 to-indigo-500" />', errors: [error, error] },
    { code: '<div className={`bg-white ${extra}`} />', errors: [error] },
    { code: "cn('bg-blue-500', active && 'text-blue-50');", errors: [error, error] },
    { code: "cva('', { variants: { tone: { info: 'bg-sky-100' } } });", errors: [error] },
    {
      code: '<div className="bg-white text-black" />',
      errors: [error],
      options: [{ allow: ['white'] }],
    },
  ],
  valid: [
    '<div className="bg-primary text-primary-foreground" />',
    '<p className="text-muted-foreground" />',
    '<span className="text-destructive" />',
    '<div className="bg-success/20 border-warning" />',
    '<div className="bg-brand-500" />',
    '<div className="bg-(--brand)" />',
    '<div className="bg-[#1a1a1a]" />',
    '<div className="text-sm border-2 shadow-md outline-none ring-offset-2" />',
    '<div className="bg-transparent text-current fill-none" />',
    // `dark:` tokens belong to no-dark-color-overrides.
    '<div className="dark:bg-gray-950" />',
    // Not a class position.
    "const tone = 'bg-blue-500';",
    '<div data-color="bg-blue-500" />',
  ],
});
