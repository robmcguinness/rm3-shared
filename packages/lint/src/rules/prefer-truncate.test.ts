import { RuleTester } from 'oxlint/plugins-dev';

import { preferTruncateRule } from './prefer-truncate.ts';

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: 'tsx' } } });
const error = { messageId: 'truncate' };

tester.run('rm3-shadcn/prefer-truncate', preferTruncateRule, {
  invalid: [
    { code: '<p className="overflow-hidden text-ellipsis whitespace-nowrap" />', errors: [error] },
    {
      code: '<p className="text-sm whitespace-nowrap text-ellipsis overflow-hidden text-muted-foreground" />',
      errors: [error],
    },
    {
      code: '<p className="md:overflow-hidden md:text-ellipsis md:whitespace-nowrap" />',
      errors: [error],
    },
    {
      code: '<p className={`overflow-hidden text-ellipsis whitespace-nowrap ${extra}`} />',
      errors: [error],
    },
    { code: "cn('overflow-hidden text-ellipsis whitespace-nowrap', className);", errors: [error] },
  ],
  valid: [
    '<p className="truncate" />',
    '<p className="overflow-hidden whitespace-nowrap" />',
    '<p className="overflow-hidden text-ellipsis" />',
    '<p className="overflow-hidden md:text-ellipsis whitespace-nowrap" />',
    // Split across strings: each string on its own is not the longhand.
    "cn('overflow-hidden', 'text-ellipsis whitespace-nowrap');",
    // Not a class position.
    "const clamp = 'overflow-hidden text-ellipsis whitespace-nowrap';",
  ],
});
