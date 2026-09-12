import { RuleTester } from 'oxlint/plugins-dev';

import { noDynamicClassNamesRule } from './no-dynamic-class-names.ts';

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: 'tsx' } } });
const error = { messageId: 'dynamicClassName' };

tester.run('rm3-tailwind/no-dynamic-class-names', noDynamicClassNamesRule, {
  invalid: [
    {
      code: '<button className={`bg-${color}-600 hover:bg-${color}-500`} />',
      errors: [error, error],
    },
    { code: '<div className={`text-${size}`} />', errors: [error] },
    { code: '<div className={`${size}px`} />', errors: [error] },
    { code: '<div className={`${a}${b}`} />', errors: [error, error] },
    { code: '<div className={`p-${n} m-2`} />', errors: [error] },
    { code: 'cn(`bg-${color}-500`, other);', errors: [error] },
    { code: 'cva(`base-${x}`);', errors: [error] },
    { code: 'cn({ [`bg-${color}`]: true });', errors: [error] },
    { code: "cn(cond ? `text-${size}` : 'text-sm');", errors: [error] },
    // A `+` chain reports once, on the outermost expression.
    { code: "<div className={'bg-' + color + '-600'} />", errors: [error] },
    { code: '<div className={prefix + suffix} />', errors: [error] },
    { code: "cn('text-' + size);", errors: [error] },
    { code: '<div className={`w-${width}` as string} />', errors: [error] },
    { code: 'tw`text-${size}`;', errors: [error], options: [{ callees: ['tw'] }] },
  ],
  valid: [
    '<div className={`${base} ${variant}`} />',
    '<div className={`${base} p-2 ${extra}`} />',
    '<div className={`p-2 ${extra}`} />',
    '<div className={`${extra} p-2`} />',
    '<div className={`${a}\n${b}`} />',
    "<div className={base + ' ' + variant} />",
    "<div className={'p-2 ' + extra} />",
    "<div className={extra + ' p-2'} />",
    '<div className={variants[variant] ?? variants.info} />',
    '<div className="bg-emerald-600" />',
    "cn(base, active && 'ring-2');",
    // Not a class position.
    'const url = `/api/${id}`;',
    '<div id={`item-${id}`} />',
    'fetch(`x-${y}`);',
    "const name = 'seed-' + id;",
    'tw`text-${size}`;',
  ],
});
