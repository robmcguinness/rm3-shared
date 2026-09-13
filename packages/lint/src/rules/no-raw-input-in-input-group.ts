import { defineRule } from '@oxlint/plugins';

import { elementName, enclosingElement } from '#shared/jsx.ts';

const REPLACEMENTS: ReadonlyMap<string, string> = new Map([
  ['Input', 'InputGroupInput'],
  ['Textarea', 'InputGroupTextarea'],
]);

/**
 * Whether `node` renders inside an `InputGroup` in the same layer. The walk
 * stops at a `*Content` element (a popover or dialog inside the group's
 * addon renders in a portal, so a control in there is not in the group).
 */
function inInputGroup(node: Parameters<typeof enclosingElement>[0]): boolean {
  let current = enclosingElement(node);
  while (current !== null) {
    const name = elementName(current.openingElement);
    if (name === 'InputGroup') {
      return true;
    }
    if (name?.endsWith('Content') === true) {
      return false;
    }
    current = enclosingElement(current);
  }
  return false;
}

/**
 * Report a raw `Input` or `Textarea` inside an `InputGroup`; the group's
 * own controls drop their border and ring so the group draws one
 * (shadcn skill, rules/forms.md).
 */
export const noRawInputInInputGroupRule = defineRule({
  createOnce(context) {
    return {
      JSXElement(node) {
        const name = elementName(node.openingElement);
        const replacement = name === null ? undefined : REPLACEMENTS.get(name);
        if (name === null || replacement === undefined || !inInputGroup(node)) {
          return;
        }
        context.report({
          data: { name, replacement },
          messageId: 'rawInput',
          node: node.openingElement,
        });
      },
    };
  },
  meta: {
    docs: {
      description:
        'Disallow a raw Input or Textarea inside InputGroup; use InputGroupInput or InputGroupTextarea.',
    },
    messages: {
      rawInput:
        '`{{name}}` inside `InputGroup` keeps its own border and focus ring, so the group draws two. Use `{{replacement}}`, which the group styles as one control.',
    },
    type: 'problem',
  },
});
