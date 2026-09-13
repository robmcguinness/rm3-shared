import { defineRule } from '@oxlint/plugins';

import { attribute, elementName, singleElementChild } from '#shared/jsx.ts';

/** Elements that pass their props to (or become) a single child. */
const TRIGGERS: ReadonlySet<string> = new Set([
  'AlertDialogTrigger',
  'BreadcrumbLink',
  'CollapsibleTrigger',
  'DialogClose',
  'DialogTrigger',
  'DrawerClose',
  'DrawerTrigger',
  'DropdownMenuTrigger',
  'HoverCardTrigger',
  'NavigationMenuLink',
  'PopoverTrigger',
  'SheetClose',
  'SheetTrigger',
  'SidebarMenuButton',
  'TooltipTrigger',
]);

/** Host elements that add nothing but a box. */
const WRAPPERS: ReadonlySet<string> = new Set(['div', 'span']);

/**
 * Report a trigger whose only child is a `div` / `span` that itself holds one
 * element; the wrapper receives the trigger's props (or, with `render` /
 * `asChild`, becomes the trigger) and puts a block inside a button (shadcn
 * skill, rules/base-vs-radix.md "Don't wrap triggers in extra elements"). A
 * wrapper around a `disabled` element passes: a disabled button fires no
 * pointer events, so the tooltip needs the span.
 */
export const noWrappedTriggerRule = defineRule({
  createOnce(context) {
    return {
      JSXElement(node) {
        const trigger = elementName(node.openingElement);
        if (trigger === null || !TRIGGERS.has(trigger)) {
          return;
        }
        const wrapper = singleElementChild(node);
        const wrapperName = wrapper === null ? null : elementName(wrapper.openingElement);
        if (wrapper === null || wrapperName === null || !WRAPPERS.has(wrapperName)) {
          return;
        }
        const inner = singleElementChild(wrapper);
        if (inner === null || attribute(inner.openingElement, 'disabled') !== null) {
          return;
        }
        context.report({
          data: {
            inner: elementName(inner.openingElement) ?? 'child',
            trigger,
            wrapper: wrapperName,
          },
          messageId: 'wrappedTrigger',
          node: wrapper.openingElement,
        });
      },
    };
  },
  meta: {
    docs: {
      description:
        'Disallow a div or span between a trigger and its single child; pass the child directly or through render.',
    },
    messages: {
      wrappedTrigger:
        "`{{trigger}}` wraps `<{{inner}}>` in a `<{{wrapper}}>`; the wrapper receives the trigger's props (or becomes the trigger with `render` / `asChild`) and puts a block inside a button. Pass `<{{inner}}>` directly, or use `render={<{{inner}} />}`.",
    },
    type: 'problem',
  },
});
