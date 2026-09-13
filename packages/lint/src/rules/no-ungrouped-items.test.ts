import { RuleTester } from 'oxlint/plugins-dev';

import { noUngroupedItemsRule } from './no-ungrouped-items.ts';

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: 'tsx' } } });
const error = { messageId: 'ungroupedItem' };

tester.run('rm3-shadcn/no-ungrouped-items', noUngroupedItemsRule, {
  invalid: [
    {
      code: '<SelectContent><SelectItem value="a">A</SelectItem><SelectItem value="b">B</SelectItem></SelectContent>',
      errors: [error, error],
    },
    { code: '<SelectContent><SelectLabel>Fruit</SelectLabel></SelectContent>', errors: [error] },
    {
      code: '<SelectContent>{items.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>',
      errors: [error],
    },
    {
      code: '<SelectContent>{items.map((item) => { return <SelectItem key={item} value={item} />; })}</SelectContent>',
      errors: [error],
    },
    { code: '<SelectContent>{open && <SelectItem value="a" />}</SelectContent>', errors: [error] },
    { code: '<SelectContent><>{<SelectItem value="a" />}</></SelectContent>', errors: [error] },
    {
      code: '<DropdownMenuContent><DropdownMenuItem>Edit</DropdownMenuItem></DropdownMenuContent>',
      errors: [error],
    },
    {
      code: '<DropdownMenuContent><DropdownMenuLabel>Account</DropdownMenuLabel></DropdownMenuContent>',
      errors: [error],
    },
    {
      code: '<DropdownMenuSubContent><DropdownMenuItem>Edit</DropdownMenuItem></DropdownMenuSubContent>',
      errors: [error],
    },
    {
      code: '<DropdownMenuContent><DropdownMenuSub><DropdownMenuSubTrigger /></DropdownMenuSub></DropdownMenuContent>',
      errors: [error],
    },
    { code: '<MenubarContent><MenubarItem>New</MenubarItem></MenubarContent>', errors: [error] },
    {
      code: '<ContextMenuContent><ContextMenuItem>Copy</ContextMenuItem></ContextMenuContent>',
      errors: [error],
    },
    { code: '<CommandList><CommandItem>Calendar</CommandItem></CommandList>', errors: [error] },
    { code: '<Command><CommandItem>Calendar</CommandItem></Command>', errors: [error] },
    {
      code: '<Tabs defaultValue="a"><TabsTrigger value="a">A</TabsTrigger></Tabs>',
      errors: [error],
    },
    {
      code: '<MessageScrollerViewport><MessageScrollerItem /></MessageScrollerViewport>',
      errors: [error],
    },
    {
      code: '<Menu.SelectContent><Menu.SelectItem value="a" /></Menu.SelectContent>',
      errors: [error],
    },
  ],
  valid: [
    '<SelectContent><SelectGroup><SelectItem value="a">A</SelectItem></SelectGroup></SelectContent>',
    '<SelectContent><SelectGroup>{items.map((item) => <SelectItem key={item} value={item} />)}</SelectGroup></SelectContent>',
    '<SelectContent>{groups.map((g) => <SelectGroup key={g.id}>{g.items.map((i) => <SelectItem key={i} value={i} />)}</SelectGroup>)}</SelectContent>',
    '<DropdownMenuContent><DropdownMenuGroup><DropdownMenuItem>Edit</DropdownMenuItem></DropdownMenuGroup></DropdownMenuContent>',
    '<DropdownMenuContent><DropdownMenuGroup><DropdownMenuSub><DropdownMenuSubContent><DropdownMenuGroup><DropdownMenuItem /></DropdownMenuGroup></DropdownMenuSubContent></DropdownMenuSub></DropdownMenuGroup></DropdownMenuContent>',
    '<CommandList><CommandGroup heading="Suggestions"><CommandItem>Calendar</CommandItem></CommandGroup></CommandList>',
    '<Tabs defaultValue="a"><TabsList><TabsTrigger value="a">A</TabsTrigger></TabsList><TabsContent value="a" /></Tabs>',
    '<MessageScrollerViewport><MessageScrollerContent><MessageScrollerItem /></MessageScrollerContent></MessageScrollerViewport>',
    // Rendered by a helper: the enclosing element is not the container.
    '<SelectContent><Options /></SelectContent>',
    'function Options() { return <SelectItem value="a" />; }',
    // A prop, not a child.
    '<SelectContent render={<SelectItem value="a" />} />',
    // Look-alikes.
    '<div><SelectItem value="a" /></div>',
    '<SelectContent><div><SelectItem value="a" /></div></SelectContent>',
  ],
});
