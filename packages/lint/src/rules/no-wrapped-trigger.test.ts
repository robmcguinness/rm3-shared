import { RuleTester } from 'oxlint/plugins-dev';

import { noWrappedTriggerRule } from './no-wrapped-trigger.ts';

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: 'tsx' } } });
const error = { messageId: 'wrappedTrigger' };

tester.run('rm3-shadcn/no-wrapped-trigger', noWrappedTriggerRule, {
  invalid: [
    { code: '<DialogTrigger><div><Button>Open</Button></div></DialogTrigger>', errors: [error] },
    {
      code: '<DropdownMenuTrigger asChild><span><MoreIcon /></span></DropdownMenuTrigger>',
      errors: [error],
    },
    {
      code: '<PopoverTrigger render={<span />}><div><Button /></div></PopoverTrigger>',
      errors: [error],
    },
    { code: '<SidebarMenuButton><div><HomeIcon /></div></SidebarMenuButton>', errors: [error] },
    {
      code: '<TooltipTrigger><span className="inline-block"><Button>Hover</Button></span></TooltipTrigger>',
      errors: [error],
    },
    { code: '<SheetClose><div><XIcon /></div></SheetClose>', errors: [error] },
  ],
  valid: [
    '<DialogTrigger render={<Button />}>Open</DialogTrigger>',
    '<DialogTrigger><Button>Open</Button></DialogTrigger>',
    '<DialogTrigger asChild><Button>Open</Button></DialogTrigger>',
    // A disabled button fires no pointer events; the span carries the tooltip.
    '<TooltipTrigger asChild><span><Button disabled>Save</Button></span></TooltipTrigger>',
    // The wrapper holds more than one thing.
    '<DialogTrigger><div><Icon /> Open</div></DialogTrigger>',
    '<DialogTrigger><div><Icon /><span>Open</span></div></DialogTrigger>',
    // Opaque children.
    '<DialogTrigger>{children}</DialogTrigger>',
    '<DialogTrigger><div>{children}</div></DialogTrigger>',
    // Not a trigger.
    '<Button><span><Icon /></span></Button>',
    '<Badge><span><Icon /></span></Badge>',
  ],
});
