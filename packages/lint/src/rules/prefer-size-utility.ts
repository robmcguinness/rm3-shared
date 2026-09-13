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

const AXIS_UTILITY = /^([wh])-(.+)$/;

/** Values `w-*` and `h-*` take but `size-*` does not. */
const NO_SIZE_EQUIVALENT: ReadonlySet<string> = new Set(['screen', 'lh']);

/**
 * `md:w-4` and `md:h-4` in one string collapse to `md:size-4`. Grouped by
 * variant chain, so `w-4 md:h-4` is two different rules and passes.
 */
function findPairs(
  group: readonly ClassToken[],
): { height: string; size: string; width: string }[] {
  const widths = new Map<string, string>();
  const heights = new Map<string, string>();
  for (const { token } of group) {
    const match = AXIS_UTILITY.exec(utilityOf(token));
    if (match === null || NO_SIZE_EQUIVALENT.has(match[2])) {
      continue;
    }
    const key = `${variantPrefixOf(token)}${match[2]}`;
    (match[1] === 'w' ? widths : heights).set(key, token);
  }
  const pairs: { height: string; size: string; width: string }[] = [];
  for (const [key, width] of widths) {
    const height = heights.get(key);
    if (height !== undefined) {
      const value = key.slice(variantPrefixOf(width).length);
      pairs.push({ height, size: `${variantPrefixOf(width)}size-${value}`, width });
    }
  }
  return pairs;
}

/**
 * Report a `w-*` / `h-*` pair with the same value in one class string; `size-*`
 * sets both (skills/rm3-shadcn, rule 2).
 */
export const preferSizeUtilityRule = defineRule({
  createOnce(context) {
    const isCallee = createCalleeMatcher(() => context.options[0]);
    return createClassValueVisitor(isCallee, (value) => {
      for (const group of staticTokenGroups(value)) {
        for (const pair of findPairs(group)) {
          context.report({ data: pair, messageId: 'sizeUtility', node: group[0].node });
        }
      }
    });
  },
  meta: {
    defaultOptions: [{ callees: [...DEFAULT_CALLEES] }],
    docs: {
      description: 'Prefer size-* over a w-* and h-* pair with the same value in one class string.',
    },
    messages: {
      sizeUtility:
        '`{{width}} {{height}}` sets one dimension twice. Replace the pair with `{{size}}`.',
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
