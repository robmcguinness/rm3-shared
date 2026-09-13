import { RuleTester } from 'oxlint/plugins-dev';

import { preferSeparatorRule } from './prefer-separator.ts';

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: 'tsx' } } });
const rawHr = { messageId: 'rawHr' };
const borderDivider = { messageId: 'borderDivider' };

tester.run('rm3-shadcn/prefer-separator', preferSeparatorRule, {
  invalid: [
    { code: '<hr />', errors: [rawHr] },
    { code: '<hr className="my-4" />', errors: [rawHr] },
    { code: '<div className="border-t" />', errors: [borderDivider] },
    { code: '<div className="border-b border-border"></div>', errors: [borderDivider] },
    { code: '<span className="md:border-l h-4" />', errors: [borderDivider] },
    { code: '<div className="border-t-2 my-4" />', errors: [borderDivider] },
    { code: '<div className={cn("border-t", className)} />', errors: [borderDivider] },
    // Whitespace-only text between the tags is not content.
    { code: '<div className="border-t">\n</div>', errors: [borderDivider] },
  ],
  valid: [
    '<Separator />',
    '<Separator orientation="vertical" />',
    // A framed section, not a divider.
    '<div className="border-t pt-4">Footer</div>',
    '<div className="border-t">{children}</div>',
    '<p className="border-b">x</p>',
    // All four edges, or two: a frame.
    '<div className="border" />',
    '<div className="border-x" />',
    '<div className="border-y" />',
    // A spread may carry children.
    '<div className="border-t" {...props} />',
    '<div className="border-transparent" />',
    '<div className="border-b-0" />',
  ],
});
