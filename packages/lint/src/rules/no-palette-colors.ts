import { defineRule } from '@oxlint/plugins';

import {
  createClassValueVisitor,
  DEFAULT_CALLEES,
  readStringArrayOption,
  staticTokenGroups,
  utilityOf,
  variantPrefixOf,
} from '#shared/class-strings.ts';
import { paletteColorOf } from '#shared/palette-colors.ts';

interface Options {
  allow: ReadonlySet<string>;
  isCallee: (name: string) => boolean;
}

function readOptions(option?: unknown): Options {
  const allow = new Set(readStringArrayOption(option, 'allow', []));
  const callees = new Set(readStringArrayOption(option, 'callees', DEFAULT_CALLEES));
  return { allow, isCallee: (name) => callees.has(name) };
}

/** Whether a `dark:` variant sits anywhere in the token's variant chain. */
export function hasDarkVariant(token: string): boolean {
  return variantPrefixOf(token).split(':').includes('dark');
}

/**
 * Report a raw Tailwind palette color (`bg-blue-500`, `text-gray-600`,
 * `border-white`); the theme's semantic tokens carry light and dark values
 * (skills/rm3-shadcn, rule 4). A token under `dark:` is left to
 * `no-dark-color-overrides`, so each token reports once.
 */
export const noPaletteColorsRule = defineRule({
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
        const { allow } = currentOptions();
        for (const group of staticTokenGroups(value)) {
          for (const { node, token } of group) {
            if (hasDarkVariant(token)) {
              continue;
            }
            const color = paletteColorOf(utilityOf(token));
            if (color !== null && !allow.has(color.value)) {
              context.report({
                data: { token, value: color.value },
                messageId: 'paletteColor',
                node,
              });
            }
          }
        }
      },
    );
  },
  meta: {
    defaultOptions: [{ allow: [], callees: [...DEFAULT_CALLEES] }],
    docs: {
      description:
        'Disallow raw Tailwind palette colors (bg-blue-500, text-gray-600); use the semantic theme tokens.',
    },
    messages: {
      paletteColor:
        '`{{token}}` hard-codes `{{value}}`, which the theme cannot restyle and dark mode does not follow. Use a semantic token (`bg-primary`, `text-muted-foreground`, `text-destructive`), a `Badge` variant, or add a `@theme` color.',
    },
    schema: [
      {
        additionalProperties: false,
        properties: {
          allow: { items: { type: 'string' }, type: 'array', uniqueItems: true },
          callees: { items: { type: 'string' }, type: 'array', uniqueItems: true },
        },
        type: 'object',
      },
    ],
    type: 'problem',
  },
});
