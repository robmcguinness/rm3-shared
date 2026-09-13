import { RuleTester } from 'oxlint/plugins-dev';

import { noPositionedInputAddonRule } from './no-positioned-input-addon.ts';

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: 'tsx' } } });
const error = { messageId: 'positionedAddon' };

tester.run('rm3-shadcn/no-positioned-input-addon', noPositionedInputAddonRule, {
  invalid: [
    {
      code: '<div className="relative"><Input className="pr-10" /><Button className="absolute right-0 top-0" size="icon"><SearchIcon /></Button></div>',
      errors: [error],
    },
    {
      code: '<div className="relative"><SearchIcon className="absolute left-2 top-2" /><Input className="pl-8" /></div>',
      errors: [error],
    },
    {
      code: '<label className="relative"><Textarea /><span className="absolute bottom-1 right-2">0/200</span></label>',
      errors: [error],
    },
    {
      code: '<div className="relative">{icon && <MailIcon className="absolute" />}<Input /></div>',
      errors: [error],
    },
    {
      code: '<div className={cn("relative", className)}><Input /><Button className={cn("absolute", "right-0")} /></div>',
      errors: [error],
    },
  ],
  valid: [
    '<InputGroup><InputGroupInput /><InputGroupAddon><SearchIcon /></InputGroupAddon></InputGroup>',
    '<InputGroup><InputGroupInput /><InputGroupAddon align="inline-end"><InputGroupButton>Go</InputGroupButton></InputGroupAddon></InputGroup>',
    // Nothing positioned over the control.
    '<div className="relative"><Input /></div>',
    '<div className="relative"><Input /><Popover /></div>',
    // Not a relative wrapper.
    '<div className="flex"><Input /><Button className="absolute" /></div>',
    // Already the grouped control.
    '<div className="relative"><InputGroupInput /><span className="absolute" /></div>',
    // The positioned element is inside a child, not beside the control.
    '<div className="relative"><Input /><Popover><PopoverContent className="absolute" /></Popover></div>',
    // A component wrapper is not read.
    '<Field className="relative"><Input /><Button className="absolute" /></Field>',
  ],
});
