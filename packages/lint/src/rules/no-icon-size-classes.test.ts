import { RuleTester } from 'oxlint/plugins-dev';

import { noIconSizeClassesRule } from './no-icon-size-classes.ts';

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: 'tsx' } } });
const error = { messageId: 'iconSizeClass' };

tester.run('rm3-shadcn/no-icon-size-classes', noIconSizeClassesRule, {
  invalid: [
    {
      code: '<Button><SearchIcon className="size-4" data-icon="inline-start" />Search</Button>',
      errors: [error],
    },
    { code: '<Button><SearchIcon className="mr-2 size-4" />Search</Button>', errors: [error] },
    // One report per icon, not per class.
    { code: '<Button><SearchIcon className="h-4 w-4" />Search</Button>', errors: [error] },
    {
      code: '<DropdownMenuItem><SettingsIcon className="mr-2 size-4" />Settings</DropdownMenuItem>',
      errors: [error],
    },
    {
      code: '<Alert><InfoIcon className="size-5" /><AlertTitle>Note</AlertTitle></Alert>',
      errors: [error],
    },
    {
      code: '<SidebarMenuButton><HomeIcon className="size-4" />Home</SidebarMenuButton>',
      errors: [error],
    },
    { code: '<Button size="icon"><Spinner className="size-4" /></Button>', errors: [error] },
    {
      code: '<Button><SearchIcon className={cn("size-4", className)} />Go</Button>',
      errors: [error],
    },
    { code: '<Button><SearchIcon className="md:size-5" />Go</Button>', errors: [error] },
    // data-icon marks an icon wherever it sits.
    {
      code: '<span><SearchIcon className="size-4" data-icon="inline-start" /></span>',
      errors: [error],
    },
    {
      code: '<Button><IconSearch className="size-4" />Search</Button>',
      errors: [error],
      options: [{ iconPrefixes: ['Icon'] }],
    },
  ],
  valid: [
    '<Button><SearchIcon data-icon="inline-start" />Search</Button>',
    '<DropdownMenuItem><SettingsIcon />Settings</DropdownMenuItem>',
    '<Button><SearchIcon className="text-muted-foreground" />Search</Button>',
    // Outside a host, sizing is the author's call.
    '<div><SearchIcon className="size-6" /></div>',
    '<SearchIcon className="size-6" />',
    '<Card><CheckIcon className="size-8 text-primary" /></Card>',
    // Not an icon.
    '<Button><Avatar className="size-6" />Profile</Button>',
    '<Button><IconSearch className="size-4" />Search</Button>',
    // A prop, not a child.
    '<Button render={<SearchIcon className="size-4" />} />',
  ],
});
