import { defineRule } from '@oxlint/plugins';

import {
  createClassValueVisitor,
  DEFAULT_CALLEES,
  readBooleanOption,
  readStringArrayOption,
  staticTokenGroups,
  utilityOf,
} from '#shared/class-strings.ts';
import { isColorUtility, paletteColorOf } from '#shared/palette-colors.ts';

import { hasDarkVariant } from './no-palette-colors.ts';

interface Options {
  isCallee: (name: string) => boolean;
  strict: boolean;
}

function readOptions(option?: unknown): Options {
  const callees = new Set(readStringArrayOption(option, 'callees', DEFAULT_CALLEES));
  return {
    isCallee: (name) => callees.has(name),
    strict: readBooleanOption(option, 'strict', false),
  };
}

/**
 * Report a `dark:` color override (`dark:bg-gray-950`, `dark:text-white`);
 * semantic tokens switch with the theme on their own (shadcn skill,
 * rules/styling.md). By default only palette values report; `strict` also reports a
 * `dark:` on a semantic token (`dark:bg-success/20`).
 */
export const noDarkColorOverridesRule = defineRule({
  createOnce(context) {
    let cachedFor: unknown = Symbol('unset');
    let options: Options = readOptions();
    const currentOptions = (): Options => {
      const option = context.options[0];
      if (option !== cachedFor) {
        cachedFor = option;
        options = readOptions(option);
      }
      return options;
    };

    return createClassValueVisitor(
      (name) => currentOptions().isCallee(name),
      (value) => {
        const { strict } = currentOptions();
        for (const group of staticTokenGroups(value)) {
          for (const { node, token } of group) {
            if (!hasDarkVariant(token)) {
              continue;
            }
            const utility = utilityOf(token);
            const reports = strict ? isColorUtility(utility) : paletteColorOf(utility) !== null;
            if (reports) {
              context.report({ data: { token }, messageId: 'darkOverride', node });
            }
          }
        }
      },
    );
  },
  meta: {
    defaultOptions: [{ callees: [...DEFAULT_CALLEES], strict: false }],
    docs: {
      description:
        'Disallow dark: color overrides; the semantic theme tokens already carry a dark value.',
    },
    messages: {
      darkOverride:
        '`{{token}}` hand-picks a dark-mode color the theme already decides. Use a semantic token (`bg-background`, `text-foreground`, `text-muted-foreground`) without `dark:`, or add a `@theme` color with both values.',
    },
    schema: [
      {
        additionalProperties: false,
        properties: {
          callees: { items: { type: 'string' }, type: 'array', uniqueItems: true },
          strict: { type: 'boolean' },
        },
        type: 'object',
      },
    ],
    type: 'problem',
  },
});
