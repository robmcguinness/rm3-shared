import { defineRule } from '@oxlint/plugins';

import {
  classTokenMatching,
  elementName,
  hasOpaqueChildren,
  meaningfulChildren,
} from '#shared/jsx.ts';

/** Host elements a divider is hand-drawn on. */
const HOSTS: ReadonlySet<string> = new Set(['div', 'span']);

/**
 * `border-t`, `border-b-2`, `border-l-border`, `border-s`: one edge. `border`,
 * `border-x` and `border-y` frame content, and `border-b-0` removes an edge;
 * none is a divider.
 */
const EDGE_BORDER = /^border-[tblrse](?:-(?!0$)|$)/;

/**
 * Report an `<hr>`, or an empty `div` / `span` whose only job is a
 * one-edge border; both are hand-drawn dividers, and `Separator` carries the
 * border token and `role="separator"` (shadcn skill, rules/composition.md
 * "Use existing components"). A `div` with content keeps its `border-t`:
 * that is a framed section, not a rule.
 */
export const preferSeparatorRule = defineRule({
  createOnce(context) {
    return {
      JSXElement(node) {
        const name = elementName(node.openingElement);
        if (name === 'hr') {
          context.report({ messageId: 'rawHr', node: node.openingElement });
          return;
        }
        if (
          name === null ||
          !HOSTS.has(name) ||
          meaningfulChildren(node).length > 0 ||
          hasOpaqueChildren(node)
        ) {
          return;
        }
        const edge = classTokenMatching(node.openingElement, (utility) =>
          EDGE_BORDER.test(utility),
        );
        if (edge === null) {
          return;
        }
        context.report({
          data: { name, token: edge.token },
          messageId: 'borderDivider',
          node: edge.node,
        });
      },
    };
  },
  meta: {
    docs: {
      description: 'Disallow <hr> and an empty div or span with a one-edge border; use Separator.',
    },
    messages: {
      borderDivider:
        'An empty `<{{name}}>` with `{{token}}` is a hand-drawn divider. Use `<Separator />` (`orientation="vertical"` for a left or right edge), which carries the border token and `role="separator"`.',
      rawHr:
        '`<hr>` is unstyled and unthemed. Use `<Separator />`, which carries the border token and `role="separator"`.',
    },
    type: 'problem',
  },
});
