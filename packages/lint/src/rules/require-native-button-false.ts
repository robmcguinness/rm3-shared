import { defineRule } from '@oxlint/plugins';

import { attribute, attributeValue, elementName, hasSpreadAttribute } from '#shared/jsx.ts';

/**
 * shadcn parts built on a Base UI component whose props extend
 * `NativeButtonProps` (`Button`, `Toggle`, the Dialog / Drawer / Popover /
 * Menu / Collapsible / Accordion / NavigationMenu triggers and closes,
 * `Select.Trigger`, `Tabs.Tab`). `TooltipTrigger`, `ContextMenuTrigger` and
 * `HoverCardTrigger` are plain elements in Base UI, and the `SidebarMenu*`
 * buttons are `useRender` wrappers; none takes `nativeButton`, so none is
 * listed.
 */
const BUTTON_OWNERS: ReadonlySet<string> = new Set([
  'AccordionTrigger',
  'AlertDialogAction',
  'AlertDialogCancel',
  'AlertDialogTrigger',
  'Button',
  'CollapsibleTrigger',
  'DialogClose',
  'DialogTrigger',
  'DrawerClose',
  'DrawerTrigger',
  'DropdownMenuSubTrigger',
  'DropdownMenuTrigger',
  'InputGroupButton',
  'MenubarTrigger',
  'NavigationMenuTrigger',
  'PopoverClose',
  'PopoverTrigger',
  'SelectTrigger',
  'SheetClose',
  'SheetTrigger',
  'TabsTrigger',
  'Toggle',
  'ToggleGroupItem',
]);

/** Components known to render something other than a button. */
const NON_BUTTON_COMPONENTS: ReadonlySet<string> = new Set([
  'Avatar',
  'Badge',
  'Card',
  'InputGroupAddon',
  'Item',
  'Link',
  'NavLink',
]);

/** Host tags Base UI treats as native buttons. */
const NATIVE_BUTTONS: ReadonlySet<string> = new Set(['button', 'input']);

function isNonButton(name: string): boolean {
  if (/^[a-z]/.test(name)) {
    return !NATIVE_BUTTONS.has(name);
  }
  return NON_BUTTON_COMPONENTS.has(name);
}

/**
 * Report `render={<a />}` (or another non-button element) on a button
 * primitive with no `nativeButton` prop; Base UI keeps treating the element
 * as a native button and skips the `role`, `tabIndex` and keyboard handling
 * a non-button needs (shadcn skill, rules/base-vs-radix.md "nativeButton").
 * A `render` that is a function or a variable is not read.
 */
export const requireNativeButtonFalseRule = defineRule({
  createOnce(context) {
    return {
      JSXAttribute(node) {
        if (node.name.type !== 'JSXIdentifier' || node.name.name !== 'render') {
          return;
        }
        const owner = node.parent;
        if (owner.type !== 'JSXOpeningElement') {
          return;
        }
        const ownerName = elementName(owner);
        if (ownerName === null || !BUTTON_OWNERS.has(ownerName)) {
          return;
        }
        const value = attributeValue(node);
        if (value?.type !== 'JSXElement') {
          return;
        }
        const target = elementName(value.openingElement);
        if (target === null || !isNonButton(target)) {
          return;
        }
        if (attribute(owner, 'nativeButton') !== null || hasSpreadAttribute(owner)) {
          return;
        }
        context.report({
          data: { owner: ownerName, target },
          messageId: 'missingNativeButton',
          node,
        });
      },
    };
  },
  meta: {
    docs: {
      description:
        'Require nativeButton={false} when render swaps a button primitive for a non-button element.',
    },
    messages: {
      missingNativeButton:
        '`{{owner}}` renders `<{{target}}>`, which is not a native button, so Base UI skips the `role`, `tabIndex` and keyboard handling a non-button needs. Add `nativeButton={false}`.',
    },
    type: 'problem',
  },
});
