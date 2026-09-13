import { defineRule } from '@oxlint/plugins';

import { attribute, classTokenMatching, elementName, meaningfulChildren } from '#shared/jsx.ts';

import type { ESTree } from '@oxlint/plugins';

/** Host elements that hold a label, as opposed to a section. */
const TEXT_HOSTS: ReadonlySet<string> = new Set([
  'b',
  'em',
  'i',
  'p',
  'small',
  'span',
  'strong',
  'time',
]);

function isSeparator(child: ESTree.JSXChild): child is ESTree.JSXElement {
  return child.type === 'JSXElement' && elementName(child.openingElement) === 'Separator';
}

function isVertical(node: ESTree.JSXElement): boolean {
  const orientation = attribute(node.openingElement, 'orientation');
  return orientation?.value?.type === 'Literal' && orientation.value.value === 'vertical';
}

/** Text, an expression, or a host element that holds inline text. */
function isLabel(child: ESTree.JSXChild): boolean {
  switch (child.type) {
    case 'JSXExpressionContainer':
    case 'JSXText':
      return true;
    case 'JSXElement': {
      const name = elementName(child.openingElement);
      return name !== null && TEXT_HOSTS.has(name);
    }
    default:
      return false;
  }
}

/**
 * Report a row that draws a label between `Separator`s, or beside one
 * stretched with `flex-1`; that is a hand-built divider row, and `Marker`
 * centers the label and draws the rules (shadcn skill, rules/chat.md
 * "System notes and dividers use Marker"). Vertical separators are toolbar
 * dividers and pass, as do sections (`CardContent`) between separators.
 */
export const preferMarkerRule = defineRule({
  createOnce(context) {
    return {
      JSXElement(node) {
        const name = elementName(node.openingElement);
        if (name === null || name === 'Marker') {
          return;
        }
        const children = meaningfulChildren(node);
        const separators = children.filter(isSeparator);
        if (separators.length === 0 || separators.some(isVertical)) {
          return;
        }
        let row = false;
        if (separators.length >= 2) {
          const first = children.indexOf(separators[0]);
          const last = children.lastIndexOf(separators.at(-1) as ESTree.JSXChild);
          row = children.slice(first + 1, last).some(isLabel);
        } else if (children.length >= 2) {
          row =
            classTokenMatching(separators[0].openingElement, (utility) => utility === 'flex-1') !==
              null && children.some(isLabel);
        }
        if (!row) {
          return;
        }
        context.report({ data: { name }, messageId: 'separatorRow', node: node.openingElement });
      },
    };
  },
  meta: {
    docs: {
      description: 'Disallow a label laid out between or beside stretched Separators; use Marker.',
    },
    messages: {
      separatorRow:
        '`<{{name}}>` draws a label beside `Separator`s by hand. Use `<Marker variant="separator"><MarkerContent>…</MarkerContent></Marker>`, which centers the label and draws the rules.',
    },
    type: 'problem',
  },
});
