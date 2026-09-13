import { RuleTester } from 'oxlint/plugins-dev';

import { preferSizeUtilityRule } from './prefer-size-utility.ts';

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: 'tsx' } } });
const error = { messageId: 'sizeUtility' };

tester.run('rm3-shadcn/prefer-size-utility', preferSizeUtilityRule, {
  invalid: [
    { code: '<div className="w-10 h-10" />', errors: [error] },
    { code: '<div className="rounded-full h-36 w-36 shrink-0" />', errors: [error] },
    { code: '<div className="w-full h-full" />', errors: [error] },
    { code: '<div className="w-px h-px" />', errors: [error] },
    { code: '<div className="w-[200px] h-[200px]" />', errors: [error] },
    { code: '<div className="md:w-4 md:h-4" />', errors: [error] },
    { code: '<div className="w-4 h-4 md:w-6 md:h-6" />', errors: [error, error] },
    { code: '<div className={`w-4 h-4 ${extra}`} />', errors: [error] },
    { code: "cn('w-4 h-4', className);", errors: [error] },
    { code: 'tw`w-4 h-4`;', errors: [error], options: [{ callees: ['tw'] }] },
  ],
  valid: [
    '<div className="size-10" />',
    '<div className="w-4 h-6" />',
    '<div className="w-4 md:h-4" />',
    '<div className="w-full h-screen" />',
    '<div className="w-screen h-screen" />',
    '<div className="min-w-4 min-h-4" />',
    // The pair is split across two strings, so neither string is a pair.
    "cn('w-4', 'h-4');",
    '<div className={`w-4 ${extra} h-4`} />',
    // Not a class position.
    "const box = 'w-4 h-4';",
    '<div id="w-4 h-4" />',
  ],
});
