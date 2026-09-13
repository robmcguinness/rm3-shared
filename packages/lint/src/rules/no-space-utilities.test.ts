import { RuleTester } from 'oxlint/plugins-dev';

import { noSpaceUtilitiesRule } from './no-space-utilities.ts';

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: 'tsx' } } });
const error = { messageId: 'spaceUtility' };

tester.run('rm3-shadcn/no-space-utilities', noSpaceUtilitiesRule, {
  invalid: [
    { code: '<div className="space-y-4" />', errors: [error] },
    { code: '<div className="flex space-x-2 items-center" />', errors: [error] },
    { code: '<div className="space-y-px" />', errors: [error] },
    { code: '<div className="space-x-reverse" />', errors: [error] },
    { code: '<div className="md:space-y-6" />', errors: [error] },
    { code: '<div className="space-y-4 space-x-2" />', errors: [error, error] },
    { code: '<div className={`space-y-4 ${extra}`} />', errors: [error] },
    { code: "cn('space-y-4', open && 'space-x-2');", errors: [error, error] },
    {
      code: "cva('space-y-2', { variants: { size: { sm: 'space-y-1' } } });",
      errors: [error, error],
    },
    { code: 'tw`space-y-4`;', errors: [error], options: [{ callees: ['tw'] }] },
  ],
  valid: [
    '<div className="flex flex-col gap-4" />',
    '<div className="flex gap-2 items-center" />',
    '<div className="whitespace-nowrap" />',
    '<div className="space-between" />',
    // Not a class position.
    "const layout = 'space-y-4';",
    '<div id="space-y-4" />',
    'tw`space-y-4`;',
  ],
});
