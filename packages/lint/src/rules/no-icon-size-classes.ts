import { defineRule } from '@oxlint/plugins';

import { utilityOf } from '#shared/class-strings.ts';
import { attribute, classTokensOf, elementName, enclosingElement } from '#shared/jsx.ts';
import { createIconMatcher, ICON_SCHEMA_PROPERTIES } from '#shared/icons.ts';

/** Components that size the icons inside them through CSS. */
const HOSTS: ReadonlySet<string> = new Set([
  'Alert',
  'Badge',
  'Button',
  'ButtonGroup',
  'CommandItem',
  'ContextMenuItem',
  'DropdownMenuItem',
  'DropdownMenuSubTrigger',
  'EmptyMedia',
  'InputGroupAddon',
  'InputGroupButton',
  'ItemMedia',
  'MenubarItem',
  'SelectItem',
  'SelectTrigger',
  'TabsTrigger',
  'Toggle',
  'ToggleGroupItem',
]);

const SIZE_UTILITY = /^(?:size|w|h)-/;

function isHost(name: string): boolean {
  return HOSTS.has(name) || name.startsWith('Sidebar');
}

/**
 * Report a size class on an icon inside a component that sizes its icons
 * (skills/rm3-shadcn, rule 12). An icon carrying `data-icon` is checked
 * wherever it sits; any other icon only inside a known host.
 */
export const noIconSizeClassesRule = defineRule({
  createOnce(context) {
    const isIcon = createIconMatcher(() => context.options[0]);
    return {
      JSXElement(node) {
        const { openingElement } = node;
        const icon = elementName(openingElement);
        if (icon === null || !isIcon(icon, openingElement)) {
          return;
        }
        const sized = classTokensOf(openingElement).filter(({ token }) =>
          SIZE_UTILITY.test(utilityOf(token)),
        );
        if (sized.length === 0) {
          return;
        }
        const parent = enclosingElement(node);
        const host = parent === null ? null : elementName(parent.openingElement);
        const explicit = attribute(openingElement, 'data-icon') !== null;
        if (!explicit && (host === null || !isHost(host))) {
          return;
        }
        context.report({
          data: {
            classes: sized.map(({ token }) => token).join(' '),
            host: host ?? 'its component',
            icon,
          },
          messageId: 'iconSizeClass',
          node: sized[0].node,
        });
      },
    };
  },
  meta: {
    defaultOptions: [{ iconNames: ['Spinner'], iconPrefixes: [], iconSuffixes: ['Icon'] }],
    docs: {
      description:
        'Disallow size-*, w-* and h-* on an icon inside Button, DropdownMenuItem, Alert, Badge, Sidebar and other components that size their icons.',
    },
    messages: {
      iconSizeClass:
        '`{{icon}}` inside `{{host}}` carries `{{classes}}`, but the component already sizes its icons through CSS and adjusts per variant. Remove the size class.',
    },
    schema: [
      {
        additionalProperties: false,
        properties: ICON_SCHEMA_PROPERTIES,
        type: 'object',
      },
    ],
    type: 'problem',
  },
});
