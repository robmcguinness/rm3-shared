import { RuleTester } from 'oxlint/plugins-dev';

import { requireNativeButtonFalseRule } from './require-native-button-false.ts';

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: 'tsx' } } });
const error = { messageId: 'missingNativeButton' };

tester.run('rm3-shadcn/require-native-button-false', requireNativeButtonFalseRule, {
  invalid: [
    { code: '<Button render={<a href="/docs" />}>Docs</Button>', errors: [error] },
    { code: '<DialogTrigger render={<span />}>Open</DialogTrigger>', errors: [error] },
    { code: '<PopoverTrigger render={<InputGroupAddon />}>$</PopoverTrigger>', errors: [error] },
    { code: '<DropdownMenuTrigger render={<Link to="/" />} />', errors: [error] },
    { code: '<SheetClose render={<div />} />', errors: [error] },
    { code: '<AlertDialogCancel render={<a href="/back" />} />', errors: [error] },
    { code: '<Button render=<a /> />', errors: [error] },
    { code: '<Button render={(<a />) as any} />', errors: [error] },
    { code: '<ToggleGroupItem render={<li />} />', errors: [error] },
  ],
  valid: [
    '<Button render={<a href="/docs" />} nativeButton={false}>Docs</Button>',
    '<Button render={<a href="/docs" />} nativeButton={isButton} />',
    // Still a native button.
    '<Button render={<button type="submit" />} />',
    '<Button render={<input type="submit" />} />',
    // A component that is (or may be) a button.
    '<DialogTrigger render={<Button />} />',
    '<DialogTrigger render={<MyButton />} />',
    // Not read: a function or a variable.
    '<Button render={renderLink} />',
    '<Button render={(props) => <a {...props} />} />',
    // Not a button primitive.
    '<Badge render={<a />} />',
    '<NavigationMenuLink render={<Link to="/" />} />',
    // No `nativeButton` prop: a plain element in Base UI, or a `useRender` wrapper.
    '<TooltipTrigger render={<Badge />}>AI</TooltipTrigger>',
    '<ContextMenuTrigger render={<div />} />',
    '<SidebarMenuButton render={<a href="/" />} />',
    '<SidebarMenuSubButton render={<Link to="/" />} />',
    // A spread may carry `nativeButton`.
    '<Button render={<a />} {...rest} />',
  ],
});
