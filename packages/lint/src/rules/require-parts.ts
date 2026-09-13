import { defineRule } from '@oxlint/plugins';

import { descendantElements, elementName, hasOpaqueChildren } from '#shared/jsx.ts';

interface Part {
  /** The name every element of the family starts with. */
  family: string;
  messageId: 'missingFallback' | 'missingTitle';
  /** The element the container must render somewhere inside. */
  part: string;
  /** Family members the linter knows cannot render the part themselves. */
  known: ReadonlySet<string>;
}

const PARTS: ReadonlyMap<string, Part> = new Map<string, Part>([
  [
    'DialogContent',
    {
      family: 'Dialog',
      known: new Set([
        'Dialog',
        'DialogTrigger',
        'DialogPortal',
        'DialogOverlay',
        'DialogHeader',
        'DialogFooter',
        'DialogDescription',
        'DialogClose',
      ]),
      messageId: 'missingTitle',
      part: 'DialogTitle',
    },
  ],
  [
    'SheetContent',
    {
      family: 'Sheet',
      known: new Set([
        'Sheet',
        'SheetTrigger',
        'SheetPortal',
        'SheetOverlay',
        'SheetHeader',
        'SheetFooter',
        'SheetDescription',
        'SheetClose',
      ]),
      messageId: 'missingTitle',
      part: 'SheetTitle',
    },
  ],
  [
    'DrawerContent',
    {
      family: 'Drawer',
      known: new Set([
        'Drawer',
        'DrawerTrigger',
        'DrawerPortal',
        'DrawerOverlay',
        'DrawerHeader',
        'DrawerFooter',
        'DrawerDescription',
        'DrawerClose',
        'DrawerHandle',
      ]),
      messageId: 'missingTitle',
      part: 'DrawerTitle',
    },
  ],
  [
    'AlertDialogContent',
    {
      family: 'AlertDialog',
      known: new Set([
        'AlertDialog',
        'AlertDialogTrigger',
        'AlertDialogPortal',
        'AlertDialogOverlay',
        'AlertDialogHeader',
        'AlertDialogFooter',
        'AlertDialogDescription',
        'AlertDialogAction',
        'AlertDialogCancel',
      ]),
      messageId: 'missingTitle',
      part: 'AlertDialogTitle',
    },
  ],
  [
    'Avatar',
    {
      family: 'Avatar',
      known: new Set(['AvatarImage']),
      messageId: 'missingFallback',
      part: 'AvatarFallback',
    },
  ],
]);

const CONTAINERS: ReadonlySet<string> = new Set(PARTS.keys());

/**
 * Report a `DialogContent` / `SheetContent` / `DrawerContent` /
 * `AlertDialogContent` with no Title, or an `Avatar` with no
 * `AvatarFallback` (shadcn skill, rules/composition.md). Content the linter cannot
 * see suppresses the report: `{children}`, a spread, or a family-named
 * component it does not know (`EditProfileDialogBody`) that may render the part.
 */
export const requirePartsRule = defineRule({
  createOnce(context) {
    return {
      JSXElement(node) {
        const container = elementName(node.openingElement);
        const spec = container === null ? undefined : PARTS.get(container);
        if (container === null || spec === undefined || hasOpaqueChildren(node)) {
          return;
        }
        let hidden = false;
        for (const element of descendantElements(
          node,
          (name) => name !== null && CONTAINERS.has(name),
        )) {
          const name = elementName(element.openingElement);
          if (name === spec.part) {
            return;
          }
          if (
            name?.includes(spec.family) === true &&
            !spec.known.has(name) &&
            !CONTAINERS.has(name)
          ) {
            hidden = true;
          }
        }
        if (hidden) {
          return;
        }
        context.report({
          data: { container, part: spec.part },
          messageId: spec.messageId,
          node: node.openingElement,
        });
      },
    };
  },
  meta: {
    docs: {
      description:
        'Require a Title inside DialogContent, SheetContent, DrawerContent and AlertDialogContent, and an AvatarFallback inside Avatar.',
    },
    messages: {
      missingFallback:
        '`{{container}}` has no `{{part}}`, so a failed image load shows nothing. Add `<{{part}}>` with the initials after `AvatarImage`.',
      missingTitle:
        '`{{container}}` has no `{{part}}`, so screen readers announce an unnamed dialog. Add `<{{part}}>` (with `className="sr-only"` if it must stay hidden).',
    },
    type: 'problem',
  },
});
