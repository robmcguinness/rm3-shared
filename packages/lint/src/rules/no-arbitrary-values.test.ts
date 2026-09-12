import { RuleTester } from 'oxlint/plugins-dev';

import { noArbitraryValuesRule } from './no-arbitrary-values.ts';

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: 'tsx' } } });
const value = { messageId: 'arbitraryValue' };
const property = { messageId: 'arbitraryProperty' };

tester.run('rm3-tailwind/no-arbitrary-values', noArbitraryValuesRule, {
  invalid: [
    { code: '<div className="bg-[#1a1a1a] text-[#fff]" />', errors: [value, value] },
    {
      code: '<div className="p-[13px] gap-[7px] mt-[17px] rounded-[5px] leading-[22px]" />',
      errors: [value, value, value, value, value],
    },
    { code: '<div class="border-[#333]" />', errors: [value] },
    { code: '<div className={"text-[11px]"} />', errors: [value] },
    { code: '<div className={`text-[11px] ${x}`} />', errors: [value] },
    // The variant is fine; the utility behind it is not.
    { code: '<div className="data-[state=open]:bg-[#fff]" />', errors: [value] },
    { code: '<div className="[&_svg]:size-[13px]" />', errors: [value] },
    { code: '<div className="has-[[data-slot]]:p-[2px]" />', errors: [value] },
    { code: '<div className="supports-[display:grid]:gap-[3px]" />', errors: [value] },
    { code: '<div className="md:hover:text-[#000]" />', errors: [value] },
    // Important, negative and opacity markers do not hide the value.
    { code: '<div className="!p-[13px]" />', errors: [value] },
    { code: '<div className="p-[13px]!" />', errors: [value] },
    { code: '<div className="-mt-[17px]" />', errors: [value] },
    { code: '<div className="bg-[#fff]/50" />', errors: [value] },
    { code: '<div className="hover:!-mt-[1px]" />', errors: [value] },
    { code: '<div className="[mask-type:luminance]" />', errors: [property] },
    // Class helpers, through every shape they accept.
    {
      code: "cn('bg-[#fff]', cond && 'p-[2px]', { 'text-[9px]': active }, ['gap-[1px]']);",
      errors: [value, value, value, value],
    },
    {
      code: "const button = cva('base', { variants: { size: { sm: 'text-[11px]' } } });",
      errors: [value],
    },
    { code: "const card = tv({ base: 'p-[3px]' });", errors: [value] },
    { code: "twMerge(base, isOpen ? 'p-[1px]' : 'p-[2px]');", errors: [value, value] },
    // A nested call reports once, from its own visit.
    { code: "cn(cn('p-[1px]'));", errors: [value] },
    { code: "<div className={cn('p-[1px]')} />", errors: [value] },
    { code: "<div className={'p-[1px]' as string} />", errors: [value] },
    { code: '<div className="h-[200px]" />', errors: [value], options: [{ allow: ['w-'] }] },
    {
      code: "classNames('p-[1px]');",
      errors: [value],
      options: [{ callees: ['classNames'] }],
    },
  ],
  valid: [
    '<div className="h-[200px] w-[350px] min-h-[300px] max-h-[80vh] min-w-[96px] max-w-[800px]" />',
    '<div className="h-[calc(100vh-64px)] md:w-[calc(100%-2rem)]" />',
    '<div className="bg-surface4 text-neutral6 p-3 rounded-md border-neutral3" />',
    // Arbitrary variants on token utilities.
    '<div className="data-[state=open]:bg-red-500 group-data-[variant=line]:text-sm" />',
    '<div className="has-[[data-slot]]:pl-4 [&_svg]:size-4 supports-[display:grid]:grid" />',
    '<div className="aria-[busy=true]:opacity-50 not-data-[active]:hidden" />',
    // v4 variable shorthand references a token.
    '<div className="bg-(--brand) w-(--sidebar-width) text-(length:--fs)" />',
    // Modifiers are a documented non-goal.
    '<div className="bg-red-500/50 bg-red-500/[0.37]" />',
    // Not a class position.
    '<div id="p-[13px]" data-value="bg-[#fff]" />',
    "const s = 'p-[13px]';",
    "classNames('p-[13px]');",
    '<div className={`p-[${n}px]`} />',
    "cn(base, active && 'ring-2', { 'text-sm': small });",
    { code: '<div className="p-[13px]" />', options: [{ allow: ['p-'] }] },
    { code: '<div className="p-[13px]" />', options: [{ allow: ['p'] }] },
    { code: "classNames('h-[1px]');", options: [{ callees: ['classNames'] }] },
  ],
});
