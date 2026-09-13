import { RuleTester } from 'oxlint/plugins-dev';

import { noRawInputInInputGroupRule } from './no-raw-input-in-input-group.ts';

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: 'tsx' } } });
const error = { messageId: 'rawInput' };

tester.run('rm3-shadcn/no-raw-input-in-input-group', noRawInputInInputGroupRule, {
  invalid: [
    { code: '<InputGroup><Input placeholder="Search..." /></InputGroup>', errors: [error] },
    { code: '<InputGroup><Textarea /></InputGroup>', errors: [error] },
    {
      code: '<InputGroup><InputGroupAddon><Input /></InputGroupAddon></InputGroup>',
      errors: [error],
    },
    { code: '<InputGroup><div><Input /></div></InputGroup>', errors: [error] },
    { code: '<InputGroup>{open && <Input />}</InputGroup>', errors: [error] },
    { code: '<InputGroup><Input /><Textarea /></InputGroup>', errors: [error, error] },
  ],
  valid: [
    '<InputGroup><InputGroupInput placeholder="Search..." /></InputGroup>',
    '<InputGroup><InputGroupTextarea /></InputGroup>',
    '<InputGroup><InputGroupInput /><InputGroupAddon><Button size="icon"><SearchIcon /></Button></InputGroupAddon></InputGroup>',
    '<Field><Input /></Field>',
    '<Input />',
    // A portal inside the addon is a different layer.
    '<InputGroup><InputGroupAddon><Popover><PopoverContent><Input /></PopoverContent></Popover></InputGroupAddon></InputGroup>',
    // A prop, not a child.
    '<InputGroup render={<Input />} />',
  ],
});
