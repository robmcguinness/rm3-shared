import { defineRule } from '@oxlint/plugins';

import { concatOperands, visitClassAttribute } from '#shared/class-strings.ts';

import type { ESTree } from '@oxlint/plugins';

/** The expression inside parentheses or a TypeScript cast. */
function unwrapped(expression: ESTree.Expression): ESTree.Expression {
  switch (expression.type) {
    case 'ParenthesizedExpression':
    case 'TSAsExpression':
    case 'TSNonNullExpression':
    case 'TSSatisfiesExpression':
    case 'TSTypeAssertion':
      return unwrapped(expression.expression);
    default:
      return expression;
  }
}

function isConditional(expression: ESTree.Expression): boolean {
  const inner = unwrapped(expression);
  return inner.type === 'ConditionalExpression' || inner.type === 'LogicalExpression';
}

/**
 * Report a ternary or `&&` interpolated into a `className` template or `+`
 * chain; `cn()` takes the condition as an argument and merges the result
 * (shadcn skill, rules/styling.md).
 */
export const noConditionalClassTemplateRule = defineRule({
  createOnce(context) {
    const report = (node: ESTree.Node): void => {
      context.report({
        data: { text: context.sourceCode.getText(node) },
        messageId: 'conditionalTemplate',
        node,
      });
    };
    return {
      JSXAttribute(node) {
        visitClassAttribute(node, (value) => {
          if (value.kind === 'template') {
            for (const expression of value.node.expressions) {
              if (isConditional(expression)) {
                report(expression);
              }
            }
          } else if (value.kind === 'concat') {
            for (const operand of concatOperands(value.node)) {
              if (isConditional(operand)) {
                report(operand);
              }
            }
          }
        });
      },
    };
  },
  meta: {
    docs: {
      description:
        'Disallow a ternary or && interpolated into a className string; pass the condition to cn().',
    },
    messages: {
      conditionalTemplate:
        'A condition spliced into a class string (`{{text}}`) is not merged and cannot be sorted or deduplicated. Pass it to `cn()`: `className={cn("base", cond && "extra")}`.',
    },
    type: 'problem',
  },
});
