import { defineRule } from '@oxlint/plugins';

import { elementName, enclosingElement } from '#shared/jsx.ts';

interface Family {
  /** The containers an item must not sit in directly. */
  containers: readonly string[];
  /** The wrapper that belongs between them. */
  group: string;
}

/** Item name to the container it must not be a direct child of, and the group that wraps it. */
const FAMILIES: ReadonlyMap<string, Family> = new Map<string, Family>([
  ['SelectItem', { containers: ['SelectContent'], group: 'SelectGroup' }],
  ['SelectLabel', { containers: ['SelectContent'], group: 'SelectGroup' }],
  ...(['DropdownMenuItem', 'DropdownMenuLabel', 'DropdownMenuSub'] as const).map(
    (item): [string, Family] => [
      item,
      { containers: ['DropdownMenuContent', 'DropdownMenuSubContent'], group: 'DropdownMenuGroup' },
    ],
  ),
  ['MenubarItem', { containers: ['MenubarContent'], group: 'MenubarGroup' }],
  ['ContextMenuItem', { containers: ['ContextMenuContent'], group: 'ContextMenuGroup' }],
  [
    'CommandItem',
    { containers: ['Command', 'CommandList', 'CommandDialog'], group: 'CommandGroup' },
  ],
  ['TabsTrigger', { containers: ['Tabs'], group: 'TabsList' }],
  [
    'MessageScrollerItem',
    { containers: ['MessageScroller', 'MessageScrollerViewport'], group: 'MessageScrollerContent' },
  ],
]);

/**
 * Report an item rendered directly in its content container; each family
 * has a group element the items belong in (shadcn skill, rules/composition.md). The
 * check looks through `.map()` callbacks, so a mapped list of items directly
 * in the container reports too.
 */
export const noUngroupedItemsRule = defineRule({
  createOnce(context) {
    return {
      JSXElement(node) {
        const item = elementName(node.openingElement);
        const family = item === null ? undefined : FAMILIES.get(item);
        if (item === null || family === undefined) {
          return;
        }
        const parent = enclosingElement(node);
        if (parent === null) {
          return;
        }
        const container = elementName(parent.openingElement);
        if (container !== null && family.containers.includes(container)) {
          context.report({
            data: { container, group: family.group, item },
            messageId: 'ungroupedItem',
            node: node.openingElement,
          });
        }
      },
    };
  },
  meta: {
    docs: {
      description:
        'Disallow SelectItem, DropdownMenuItem, CommandItem, TabsTrigger and friends directly inside their content container; wrap them in their Group.',
    },
    messages: {
      ungroupedItem:
        '`{{item}}` sits directly in `{{container}}`, outside the group that lays it out and labels it. Wrap the items in `{{group}}`.',
    },
    type: 'problem',
  },
});
