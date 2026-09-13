import { defineRule } from '@oxlint/plugins';

import { utilityOf } from '#shared/class-strings.ts';
import { classTokensOf, elementName } from '#shared/jsx.ts';

/** Overlay surfaces whose stacking the primitive owns. */
const OVERLAYS: ReadonlySet<string> = new Set([
  'AlertDialogContent',
  'AlertDialogOverlay',
  'CommandDialog',
  'ContextMenuContent',
  'ContextMenuSubContent',
  'DialogContent',
  'DialogOverlay',
  'DrawerContent',
  'DrawerOverlay',
  'DropdownMenuContent',
  'DropdownMenuSubContent',
  'HoverCardContent',
  'MenubarContent',
  'PopoverContent',
  'SelectContent',
  'SheetContent',
  'SheetOverlay',
  'TooltipContent',
]);

/**
 * Report a `z-*` class on an overlay component; the primitives stack
 * themselves, and a manual value fights the next overlay that opens
 * (skills/rm3-shadcn, rule 10).
 */
export const noOverlayZIndexRule = defineRule({
  createOnce(context) {
    return {
      JSXOpeningElement(node) {
        const component = elementName(node);
        if (component === null || !OVERLAYS.has(component)) {
          return;
        }
        for (const { node: target, token } of classTokensOf(node)) {
          if (utilityOf(token).startsWith('z-')) {
            context.report({
              data: { component, token },
              messageId: 'overlayZIndex',
              node: target,
            });
          }
        }
      },
    };
  },
  meta: {
    docs: {
      description:
        'Disallow a z-* class on Dialog, Sheet, Drawer, Popover, Tooltip and other overlay content; the primitives manage stacking.',
    },
    messages: {
      overlayZIndex:
        '`{{token}}` on `{{component}}` overrides the stacking the primitive manages, so a later overlay can open underneath it. Remove the class; fix the layer in the primitive if it is wrong.',
    },
    type: 'problem',
  },
});
