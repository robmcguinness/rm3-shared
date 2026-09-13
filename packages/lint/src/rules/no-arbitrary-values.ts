import { defineRule } from '@oxlint/plugins';

import {
  createClassValueVisitor,
  DEFAULT_CALLEES,
  quasiText,
  readStringArrayOption,
  splitClassTokens,
  utilityOf,
} from '#shared/class-strings.ts';

import type { ESTree } from '@oxlint/plugins';

/** The skill's one exception: precise sizing on height and width. */
const DEFAULT_ALLOW: readonly string[] = ['h-', 'w-', 'min-h-', 'max-h-', 'min-w-', 'max-w-'];

type Arbitrary = { kind: 'property' } | { kind: 'value'; prefix: string } | null;

/**
 * `[mask-type:luminance]` is an arbitrary property; `p-[13px]` is an arbitrary
 * value with prefix `p-`. The v4 variable shorthand `bg-(--brand)` has no
 * bracket and references a token, so it is neither.
 */
function arbitraryOf(utility: string): Arbitrary {
  if (!utility.endsWith(']')) {
    return null;
  }
  if (utility.startsWith('[')) {
    return { kind: 'property' };
  }
  const open = utility.indexOf('[');
  if (open > 0 && utility[open - 1] === '-') {
    return { kind: 'value', prefix: utility.slice(0, open) };
  }
  return null;
}

interface Options {
  allow: ReadonlySet<string>;
  allowed: string;
  isCallee: (name: string) => boolean;
}

function readOptions(option?: unknown): Options {
  const allow = new Set(
    readStringArrayOption(option, 'allow', DEFAULT_ALLOW).map((prefix) =>
      prefix.endsWith('-') ? prefix : `${prefix}-`,
    ),
  );
  const callees = new Set(readStringArrayOption(option, 'callees', DEFAULT_CALLEES));
  return {
    allow,
    allowed: [...allow].map((prefix) => `${prefix}[…]`).join(', '),
    isCallee: (name) => callees.has(name),
  };
}

/**
 * Report Tailwind arbitrary values (`bg-[#1a1a1a]`, `p-[13px]`) outside the
 * allowed utility prefixes. Design tokens live in `@theme`
 * (skills/rm3-tailwind, "Enforced by lint").
 */
export const noArbitraryValuesRule = defineRule({
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

    const checkTokens = (text: string, node: ESTree.Node): void => {
      const { allow, allowed } = currentOptions();
      for (const token of splitClassTokens(text)) {
        const arbitrary = arbitraryOf(utilityOf(token));
        if (arbitrary === null) {
          continue;
        }
        if (arbitrary.kind === 'property') {
          context.report({ data: { token }, messageId: 'arbitraryProperty', node });
        } else if (!allow.has(arbitrary.prefix)) {
          context.report({ data: { allowed, token }, messageId: 'arbitraryValue', node });
        }
      }
    };

    return createClassValueVisitor(
      (name) => currentOptions().isCallee(name),
      (value) => {
        if (value.kind === 'literal') {
          checkTokens(value.node.value, value.node);
        } else if (value.kind === 'template') {
          // A chunk cut by `${}` never ends in `]`, so a split token like
          // `p-[` cannot fire here; `no-dynamic-class-names` owns that case.
          for (const quasi of value.node.quasis) {
            checkTokens(quasiText(quasi), quasi);
          }
        }
      },
    );
  },
  meta: {
    defaultOptions: [{ allow: [...DEFAULT_ALLOW], callees: [...DEFAULT_CALLEES] }],
    docs: {
      description:
        'Disallow Tailwind arbitrary values (bg-[#fff], p-[13px]) outside the height and width utilities; design tokens live in @theme.',
    },
    messages: {
      arbitraryProperty:
        '`{{token}}` is raw CSS in a class name and bypasses every token. Add an `@utility` in CSS, or use the token utility that already exists.',
      arbitraryValue:
        '`{{token}}` hard-codes a value the design system cannot update. Use a `@theme` token utility (`bg-brand-500`, `p-3`, `rounded-md`); arbitrary values are allowed only on {{allowed}}.',
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
