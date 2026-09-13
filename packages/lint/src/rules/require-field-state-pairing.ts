import { defineRule } from '@oxlint/plugins';

import {
  attribute,
  descendantElements,
  elementName,
  enclosingElement,
  hasOpaqueChildren,
  hasSpreadAttribute,
} from '#shared/jsx.ts';

import type { ESTree } from '@oxlint/plugins';

interface Pair {
  /** The attribute on the control. */
  control: string;
  /** The attribute on `Field`. */
  field: string;
}

const PAIRS: readonly Pair[] = [
  { control: 'aria-invalid', field: 'data-invalid' },
  { control: 'disabled', field: 'data-disabled' },
];

/** Controls a `Field` labels. */
const CONTROLS: ReadonlySet<string> = new Set([
  'Checkbox',
  'Input',
  'InputGroupInput',
  'InputGroupTextarea',
  'InputOTP',
  'NativeSelect',
  'RadioGroupItem',
  'Select',
  'Slider',
  'Switch',
  'Textarea',
]);

/** Components under a `Field` the linter knows do not render a control themselves. */
const LEAVES: ReadonlySet<string> = new Set(['Button', 'Label', 'RadioGroup', 'Spinner']);

/** Families whose parts are known leaves. */
const LEAF_PREFIXES: readonly string[] = ['Field', 'InputGroup', 'InputOTP', 'Select'];

function isKnownLeaf(name: string): boolean {
  return (
    LEAVES.has(name) ||
    name.endsWith('Icon') ||
    LEAF_PREFIXES.some((prefix) => name.startsWith(prefix))
  );
}

function nearestField(node: ESTree.JSXElement): ESTree.JSXElement | null {
  let current = enclosingElement(node);
  while (current !== null && elementName(current.openingElement) !== 'Field') {
    current = enclosingElement(current);
  }
  return current;
}

/**
 * Report a `Field` whose `data-invalid` / `data-disabled` has no control
 * under it carrying `aria-invalid` / `disabled`, and a control carrying one
 * whose `Field` lacks the other; the `data-*` styles the label and
 * description, the control attribute styles the control (shadcn skill,
 * rules/forms.md "Field validation and disabled states"). Presence only:
 * `data-invalid={!!error}` beside `aria-invalid={!!error}` passes. A `Field`
 * with content the linter cannot see (`{children}`, a spread, a component it
 * does not know) passes.
 */
export const requireFieldStatePairingRule = defineRule({
  createOnce(context) {
    const checkField = (node: ESTree.JSXElement): void => {
      for (const pair of PAIRS) {
        const marker = attribute(node.openingElement, pair.field);
        if (marker === null) {
          continue;
        }
        if (hasOpaqueChildren(node)) {
          return;
        }
        const controls = new Set<string>();
        let paired = false;
        let hidden = false;
        for (const element of descendantElements(node, (name) => name === 'Field')) {
          const name = elementName(element.openingElement);
          if (name === null || name === 'Field') {
            continue;
          }
          if (CONTROLS.has(name)) {
            if (hasSpreadAttribute(element.openingElement)) {
              hidden = true;
              break;
            }
            controls.add(name);
            if (attribute(element.openingElement, pair.control) !== null) {
              paired = true;
              break;
            }
          } else if (/^[A-Z]/.test(name) && !isKnownLeaf(name)) {
            hidden = true;
            break;
          }
        }
        if (paired || hidden || controls.size === 0) {
          continue;
        }
        context.report({
          data: {
            controlAttr: pair.control,
            controls: [...controls].join(' / '),
            fieldAttr: pair.field,
          },
          messageId: 'controlMissingState',
          node: marker,
        });
      }
    };

    const checkControl = (node: ESTree.JSXElement, name: string): void => {
      for (const pair of PAIRS) {
        const marker = attribute(node.openingElement, pair.control);
        if (marker === null) {
          continue;
        }
        const field = nearestField(node);
        if (
          field === null ||
          hasSpreadAttribute(field.openingElement) ||
          attribute(field.openingElement, pair.field) !== null
        ) {
          continue;
        }
        context.report({
          data: { controlAttr: pair.control, fieldAttr: pair.field, name },
          messageId: 'fieldMissingState',
          node: marker,
        });
      }
    };

    return {
      JSXElement(node) {
        const name = elementName(node.openingElement);
        if (name === 'Field') {
          checkField(node);
        } else if (name !== null && CONTROLS.has(name)) {
          checkControl(node, name);
        }
      },
    };
  },
  meta: {
    docs: {
      description:
        'Require data-invalid on Field to pair with aria-invalid on its control, and data-disabled with disabled.',
    },
    messages: {
      controlMissingState:
        '`Field` carries `{{fieldAttr}}` but no control under it carries `{{controlAttr}}`; `{{fieldAttr}}` styles the label and description, `{{controlAttr}}` styles the control. Add `{{controlAttr}}` to the `{{controls}}`.',
      fieldMissingState:
        '`{{name}}` carries `{{controlAttr}}` but its `Field` has no `{{fieldAttr}}`, so the label and description do not follow. Add `{{fieldAttr}}` to the `Field`.',
    },
    type: 'problem',
  },
});
