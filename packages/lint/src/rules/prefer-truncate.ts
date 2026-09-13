import { defineRule } from '@oxlint/plugins';

import {
  createCalleeMatcher,
  createClassValueVisitor,
  DEFAULT_CALLEES,
  staticTokenGroups,
  utilityOf,
  variantPrefixOf,
} from '#shared/class-strings.ts';

import type { ClassToken } from '#shared/class-strings.ts';

/** The three utilities `truncate` expands to. */
const LONGHAND: readonly string[] = ['overflow-hidden', 'text-ellipsis', 'whitespace-nowrap'];

/** The variant chains under which all three longhand utilities appear. */
function longhandVariants(group: readonly ClassToken[]): string[] {
  const seen = new Map<string, Set<string>>();
  for (const { token } of group) {
    const utility = utilityOf(token);
    if (!LONGHAND.includes(utility)) {
      continue;
    }
    const variant = variantPrefixOf(token);
    const utilities = seen.get(variant) ?? new Set<string>();
    utilities.add(utility);
    seen.set(variant, utilities);
  }
  const variants: string[] = [];
  for (const [variant, utilities] of seen) {
    if (utilities.size === LONGHAND.length) {
      variants.push(variant);
    }
  }
  return variants;
}

/**
 * Report `overflow-hidden text-ellipsis whitespace-nowrap` spelled out;
 * `truncate` is the same three declarations (skills/rm3-shadcn, rule 3).
 */
export const preferTruncateRule = defineRule({
  createOnce(context) {
    const isCallee = createCalleeMatcher(() => context.options[0]);
    return createClassValueVisitor(isCallee, (value) => {
      for (const group of staticTokenGroups(value)) {
        for (const variant of longhandVariants(group)) {
          context.report({
            data: { replacement: `${variant}truncate`, variant },
            messageId: 'truncate',
            node: group[0].node,
          });
        }
      }
    });
  },
  meta: {
    defaultOptions: [{ callees: [...DEFAULT_CALLEES] }],
    docs: {
      description:
        'Prefer truncate over overflow-hidden text-ellipsis whitespace-nowrap in one class string.',
    },
    messages: {
      truncate:
        '`{{variant}}overflow-hidden {{variant}}text-ellipsis {{variant}}whitespace-nowrap` is what `truncate` expands to. Replace the three with `{{replacement}}`.',
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
