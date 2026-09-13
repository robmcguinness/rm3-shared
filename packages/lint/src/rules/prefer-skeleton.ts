import { defineRule } from '@oxlint/plugins';

import { classTokenMatching, elementName } from '#shared/jsx.ts';

/** Host elements a placeholder is hand-built from. */
const HOSTS: ReadonlySet<string> = new Set(['div', 'span']);

/**
 * Report `animate-pulse` on a `div` or `span`; that is a hand-rolled loading
 * placeholder, and `Skeleton` carries the pulse, the surface color and the
 * radius (shadcn skill, rules/composition.md "Use existing components"). A
 * component element never matches: `Skeleton` itself pulses, and a `Badge`
 * that pulses is a live indicator, not a placeholder.
 */
export const preferSkeletonRule = defineRule({
  createOnce(context) {
    return {
      JSXElement(node) {
        const name = elementName(node.openingElement);
        if (name === null || !HOSTS.has(name)) {
          return;
        }
        const pulse = classTokenMatching(
          node.openingElement,
          (utility) => utility === 'animate-pulse',
        );
        if (pulse === null) {
          return;
        }
        context.report({
          data: { name, token: pulse.token },
          messageId: 'rawPulse',
          node: pulse.node,
        });
      },
    };
  },
  meta: {
    docs: {
      description:
        'Disallow animate-pulse on a div or span; use Skeleton for loading placeholders.',
    },
    messages: {
      rawPulse:
        '`<{{name}}>` with `{{token}}` is a hand-rolled placeholder. Use `<Skeleton className="h-4 w-3/4" />`, which carries the pulse, the surface color and the radius; for placeholder text use the `shimmer` utility.',
    },
    type: 'problem',
  },
});
