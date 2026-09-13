import { RuleTester } from 'oxlint/plugins-dev';

import { requireIconDataIconRule } from './require-icon-data-icon.ts';

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: 'tsx' } } });
const error = { messageId: 'missingDataIcon' };

tester.run('rm3-shadcn/require-icon-data-icon', requireIconDataIconRule, {
  invalid: [
    { code: '<Button><SearchIcon />Search</Button>', errors: [error] },
    { code: '<Button>Next<ArrowRightIcon /></Button>', errors: [error] },
    { code: '<Button><Spinner />Saving...</Button>', errors: [error] },
    { code: '<Button><SearchIcon />{label}</Button>', errors: [error] },
    { code: '<Button><SearchIcon /><span>Search</span></Button>', errors: [error] },
    { code: '<Button><SearchIcon className="mr-2" />\n  Search\n</Button>', errors: [error] },
    {
      code: '<Button><IconSearch />Search</Button>',
      errors: [error],
      options: [{ iconPrefixes: ['Icon'] }],
    },
  ],
  valid: [
    '<Button><SearchIcon data-icon="inline-start" />Search</Button>',
    '<Button>Next<ArrowRightIcon data-icon="inline-end" /></Button>',
    '<Button disabled><Spinner data-icon="inline-start" />Saving...</Button>',
    // Icon-only button.
    '<Button size="icon"><SearchIcon /></Button>',
    '<Button size="icon">\n  <SearchIcon />\n</Button>',
    '<Button size="icon-sm"><SearchIcon /><span>Search</span></Button>',
    '<Button><span className="sr-only">Go to first page</span><ChevronsLeftIcon /></Button>',
    '<Button><ChevronsLeftIcon /><span className={cn("sr-only", extra)}>First</span></Button>',
    // Not an icon by name.
    '<Button><Avatar />Profile</Button>',
    '<Button><IconSearch />Search</Button>',
    // Props the linter cannot see.
    '<Button><SearchIcon {...iconProps} />Search</Button>',
    // Not a Button.
    '<DropdownMenuItem><SettingsIcon />Settings</DropdownMenuItem>',
    '<a><SearchIcon />Search</a>',
  ],
});
