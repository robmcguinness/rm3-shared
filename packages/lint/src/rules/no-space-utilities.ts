import { defineRule } from '@oxlint/plugins';

import {
  createCalleeMatcher,
  createClassValueVisitor,
  DEFAULT_CALLEES,
  staticTokenGroups,
  utilityOf,
} from '#shared/class-strings.ts';

/** `space-x-4`, `space-y-px`, `space-y-reverse`. */
const SPACE_UTILITY = /^space-([xy])-/;

/**
 * Report `space-x-*` / `space-y-*`; a flex container with `gap-*` spaces its
 * children without margin hacks (skills/rm3-shadcn, rule 1).
 */
export const noSpaceUtilitiesRule = defineRule({
  createOnce(context) {
    const isCallee = createCalleeMatcher(() => context.options[0]);
    return createClassValueVisitor(isCallee, (value) => {
      for (const group of staticTokenGroups(value)) {
        for (const { node, token } of group) {
          const match = SPACE_UTILITY.exec(utilityOf(token));
          if (match !== null) {
            const replacement = match[1] === 'y' ? 'flex flex-col gap-*' : 'flex gap-*';
            context.report({ data: { replacement, token }, messageId: 'spaceUtility', node });
          }
        }
      }
    });
  },
  meta: {
    defaultOptions: [{ callees: [...DEFAULT_CALLEES] }],
    docs: {
      description:
        'Disallow space-x-* and space-y-*; space children with a flex container and gap-*.',
    },
    messages: {
      spaceUtility:
        '`{{token}}` spaces children with margins that break on wrapping and conditional rendering. Use `{{replacement}}` on the container instead.',
    },
    schema: [
      {
        additionalProperties: false,
        properties: {
          callees: { items: { type: 'string' }, type: 'array', uniqueItems: true },
        },
        type: 'object',
      },
    ],
    type: 'problem',
  },
});
