import { defineRule } from '@oxlint/plugins';

import { utilityOf } from '#shared/class-strings.ts';
import { attribute, classTokensOf, elementName, meaningfulChildren } from '#shared/jsx.ts';
import { createIconMatcher, ICON_SCHEMA_PROPERTIES } from '#shared/icons.ts';

import type { ESTree } from '@oxlint/plugins';

/** Components whose icon children take `data-icon`. */
const HOSTS: ReadonlySet<string> = new Set(['Button']);

/** `size="icon"`, `"icon-sm"`, `"icon-xs"`, `"icon-lg"`: an icon-only button. */
function isIconSized(node: ESTree.JSXOpeningElement): boolean {
  const size = attribute(node, 'size');
  return (
    size?.value?.type === 'Literal' &&
    typeof size.value.value === 'string' &&
    size.value.value.startsWith('icon')
  );
}

/** A visually hidden label (`<span className="sr-only">`) is not text beside the icon. */
function isVisuallyHidden(child: ESTree.JSXChild): boolean {
  return (
    child.type === 'JSXElement' &&
    classTokensOf(child.openingElement).some(({ token }) => utilityOf(token) === 'sr-only')
  );
}

/**
 * Report an icon beside text inside a `Button` with no `data-icon`; the
 * attribute is what the button's CSS keys its icon gap and padding on
 * (skills/rm3-shadcn, rule 11). An icon-only button passes: `size="icon*"`,
 * a single child, or an icon beside an `sr-only` label.
 */
export const requireIconDataIconRule = defineRule({
  createOnce(context) {
    const isIcon = createIconMatcher(() => context.options[0]);
    return {
      JSXElement(node) {
        const host = elementName(node.openingElement);
        if (host === null || !HOSTS.has(host) || isIconSized(node.openingElement)) {
          return;
        }
        const children = meaningfulChildren(node).filter((child) => !isVisuallyHidden(child));
        if (children.length < 2) {
          return;
        }
        const first = children[0];
        const last = children.at(-1);
        for (const child of children) {
          if (child.type !== 'JSXElement') {
            continue;
          }
          const { openingElement } = child;
          const icon = elementName(openingElement);
          if (icon === null || !isIcon(icon, openingElement)) {
            continue;
          }
          if (attribute(openingElement, 'data-icon') !== null || hasSpread(openingElement)) {
            continue;
          }
          const position =
            child === first ? 'inline-start' : child === last ? 'inline-end' : 'inline-start';
          context.report({
            data: { host, icon, position },
            messageId: 'missingDataIcon',
            node: openingElement,
          });
        }
      },
    };
  },
  meta: {
    defaultOptions: [{ iconNames: ['Spinner'], iconPrefixes: [], iconSuffixes: ['Icon'] }],
    docs: {
      description: 'Require data-icon on an icon rendered beside text inside a Button.',
    },
    messages: {
      missingDataIcon:
        '`{{icon}}` inside `{{host}}` has no `data-icon`, so the button does not apply its icon gap and padding. Add `data-icon="{{position}}"`.',
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

function hasSpread(node: ESTree.JSXOpeningElement): boolean {
  return node.attributes.some((item) => item.type === 'JSXSpreadAttribute');
}
