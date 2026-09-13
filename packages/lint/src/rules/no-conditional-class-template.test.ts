import { RuleTester } from 'oxlint/plugins-dev';

import { noConditionalClassTemplateRule } from './no-conditional-class-template.ts';

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: 'tsx' } } });
const error = { messageId: 'conditionalTemplate' };

tester.run('rm3-shadcn/no-conditional-class-template', noConditionalClassTemplateRule, {
  invalid: [
    {
      code: '<div className={`flex items-center ${isActive ? "bg-primary" : "bg-muted"}`} />',
      errors: [error],
    },
    { code: '<div className={`flex ${open && "hidden"}`} />', errors: [error] },
    { code: '<div className={`${a ? "x" : "y"} ${b ? "p" : "q"}`} />', errors: [error, error] },
    { code: '<div className={`flex ${(open ? "a" : "b") as string}`} />', errors: [error] },
    { code: "<div className={'flex ' + (open ? 'a' : 'b')} />", errors: [error] },
    { code: "<div className={'flex ' + (open && 'a')} />", errors: [error] },
    // Nested in a branch the walker already descends into.
    { code: '<div className={wide ? `flex ${open ? "a" : "b"}` : "flex"} />', errors: [error] },
  ],
  valid: [
    '<div className={cn("flex items-center", isActive ? "bg-primary" : "bg-muted")} />',
    '<div className={cn("flex", open && "hidden")} />',
    '<div className={isActive ? "bg-primary" : "bg-muted"} />',
    '<div className={`flex ${className}`} />',
    '<div className={`${base} ${variants[variant]}`} />',
    "<div className={'flex ' + className} />",
    '<div className="flex items-center" />',
    // Helpers are cn()\'s job; the rule only reads the attribute itself.
    'cn(`flex ${open ? "a" : "b"}`);',
    // Not a class position.
    '<div id={`item-${open ? "a" : "b"}`} />',
    'const url = `/api/${flag ? "a" : "b"}`;',
  ],
});
