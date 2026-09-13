import { defineRule } from '@oxlint/plugins';

import {
  concatOperands,
  createCalleeMatcher,
  createClassValueVisitor,
  DEFAULT_CALLEES,
  quasiText,
} from '#shared/class-strings.ts';

import type { ESTree } from '@oxlint/plugins';

const ENDS_IN_SPACE = /\s$/;
const STARTS_WITH_SPACE = /^\s/;

/**
 * Report each `${}` glued to text on either side: `bg-${color}-600`,
 * `text-${size}`, `${a}${b}`. Whole-token interpolation (`${base} ${extra}`)
 * is fine because every static class is still visible to Tailwind.
 */
function gluedExpressions(template: ESTree.TemplateLiteral): ESTree.Expression[] {
  const { expressions, quasis } = template;
  const last = expressions.length - 1;
  return expressions.filter((_, index) => {
    const left = quasiText(quasis[index]);
    const right = quasiText(quasis[index + 1]);
    const leftOk = (index === 0 && left === '') || ENDS_IN_SPACE.test(left);
    const rightOk = (index === last && right === '') || STARTS_WITH_SPACE.test(right);
    return !leftOk || !rightOk;
  });
}

/** The static text at the end of an operand, or null when it is not a string. */
function tailText(node: ESTree.Expression): string | null {
  if (node.type === 'Literal' && typeof node.value === 'string') {
    return node.value;
  }
  if (node.type === 'TemplateLiteral') {
    const lastQuasi = node.quasis.at(-1);
    return lastQuasi === undefined ? '' : quasiText(lastQuasi);
  }
  return null;
}

function headText(node: ESTree.Expression): string | null {
  if (node.type === 'Literal' && typeof node.value === 'string') {
    return node.value;
  }
  if (node.type === 'TemplateLiteral') {
    return quasiText(node.quasis[0]);
  }
  return null;
}

/** Whether two adjacent `+` operands join without whitespace between them. */
function isGlued(left: ESTree.Expression, right: ESTree.Expression): boolean {
  const tail = tailText(left);
  if (tail !== null) {
    return !ENDS_IN_SPACE.test(tail);
  }
  const head = headText(right);
  if (head !== null) {
    return !STARTS_WITH_SPACE.test(head);
  }
  return true;
}

/**
 * Report class names assembled at runtime; Tailwind only emits classes it
 * finds whole in source (skills/rm3-tailwind, "Enforced by lint").
 */
export const noDynamicClassNamesRule = defineRule({
  createOnce(context) {
    const isCallee = createCalleeMatcher(() => context.options[0]);

    const report = (node: ESTree.Node): void => {
      context.report({
        data: { text: context.sourceCode.getText(node) },
        messageId: 'dynamicClassName',
        node,
      });
    };

    return createClassValueVisitor(isCallee, (value) => {
      if (value.kind === 'template') {
        for (const expression of gluedExpressions(value.node)) {
          report(expression);
        }
      } else if (value.kind === 'concat') {
        const operands = concatOperands(value.node);
        const glued = operands.some(
          (operand, index) => index > 0 && isGlued(operands[index - 1], operand),
        );
        if (glued) {
          report(value.node);
        }
      }
    });
  },
  meta: {
    defaultOptions: [{ callees: [...DEFAULT_CALLEES] }],
    docs: {
      description:
        'Disallow building Tailwind class names from interpolation or concatenation; Tailwind only generates classes it finds whole in source.',
    },
    messages: {
      dynamicClassName:
        'Tailwind only generates classes it finds whole in source; a class built from `{{text}}` is never emitted. Write each complete class as a literal and select between them (a variants map or `cva`).',
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
