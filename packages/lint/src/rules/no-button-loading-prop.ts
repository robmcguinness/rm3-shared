import { defineRule } from '@oxlint/plugins';

import { elementName } from '#shared/jsx.ts';

/** Button primitives, and the button-shaped parts that share their composition. */
const HOSTS: ReadonlySet<string> = new Set([
  'AlertDialogAction',
  'AlertDialogCancel',
  'Button',
  'InputGroupButton',
  'SidebarMenuButton',
  'SidebarMenuSubButton',
]);

const PROPS: ReadonlySet<string> = new Set(['isLoading', 'isPending', 'loading', 'pending']);

/**
 * Report a loading prop on a `Button`; shadcn's button has none, and a
 * wrapper that adds one hides the spinner and the disabled state from the
 * composition (shadcn skill, rules/composition.md "Button has no isPending
 * or isLoading prop"). `typeCheck` rejects the prop on the stock component;
 * this catches the wrapper that accepts it.
 */
export const noButtonLoadingPropRule = defineRule({
  createOnce(context) {
    return {
      JSXElement(node) {
        const host = elementName(node.openingElement);
        if (host === null || !HOSTS.has(host)) {
          return;
        }
        for (const item of node.openingElement.attributes) {
          if (
            item.type === 'JSXAttribute' &&
            item.name.type === 'JSXIdentifier' &&
            PROPS.has(item.name.name)
          ) {
            context.report({
              data: { host, prop: item.name.name },
              messageId: 'loadingProp',
              node: item,
            });
          }
        }
      },
    };
  },
  meta: {
    docs: {
      description:
        'Disallow isLoading, isPending and loading props on Button; compose Spinner with data-icon and disabled instead.',
    },
    messages: {
      loadingProp:
        '`{{host}}` has no `{{prop}}` prop; a wrapper that adds one hides the spinner and the disabled state from the markup. Render `<Spinner data-icon="inline-start" />` beside the label and set `disabled` while pending.',
    },
    type: 'problem',
  },
});
