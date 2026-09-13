import { defineRule } from '@oxlint/plugins';

import { readStringOption } from '#shared/class-strings.ts';
import { attribute, attributeValue, elementName, hasSpreadAttribute } from '#shared/jsx.ts';

import type { ESTree } from '@oxlint/plugins';

const BASES = ['base', 'radix'] as const;
type Base = (typeof BASES)[number];

const VALUE_PROPS: readonly string[] = ['defaultValue', 'value'];

/** A `value="a"` or `value={'a'}`. */
function isStringLiteral(node: ESTree.JSXAttribute): boolean {
  const value = attributeValue(node);
  return value?.type === 'Literal' && typeof value.value === 'string';
}

/** A `value={50}`. */
function isNumberLiteral(node: ESTree.JSXAttribute): boolean {
  const value = attributeValue(node);
  return value?.type === 'Literal' && typeof value.value === 'number';
}

/** A `value={[50]}`. */
function isSingleArray(node: ESTree.JSXAttribute): boolean {
  const value = attributeValue(node);
  return (
    value?.type === 'ArrayExpression' &&
    value.elements.length === 1 &&
    value.elements[0] !== null &&
    value.elements[0].type !== 'SpreadElement'
  );
}

/** A `render={<a />}`: the element form Base UI takes. A function is not read. */
function isElementRender(node: ESTree.JSXAttribute): boolean {
  return attributeValue(node)?.type === 'JSXElement';
}

/**
 * Report a prop from the other primitive base: Radix's `asChild`, `type`,
 * `collapsible` and `position` in a Base UI project, or Base UI's `render`,
 * `multiple`, `alignItemWithTrigger` and `itemToStringValue` in a Radix one,
 * plus the value shapes that differ (`ToggleGroup` / `Accordion` take an
 * array under Base UI; `Slider` takes a number for one thumb) (shadcn skill,
 * rules/base-vs-radix.md). Which base is the `base` option, default
 * `'base'`; a non-literal value is not read. `SelectValue placeholder` is not
 * reported: Base UI's `Select.Value` takes `placeholder` too, so the skill's
 * `{ value: null }` item is a preference, not the other base's API.
 */
export const noBaseApiMismatchRule = defineRule({
  createOnce(context) {
    const readBase = (): Base => readStringOption(context.options[0], 'base', 'base', BASES);

    const reportOther = (
      node: ESTree.JSXAttribute,
      name: string,
      attr: string,
      fix: string,
    ): void => {
      const base = readBase();
      context.report({
        data: { attr, base, fix, name, other: base === 'base' ? 'Radix' : 'Base UI' },
        messageId: 'otherApi',
        node,
      });
    };

    const checkBase = (opening: ESTree.JSXOpeningElement, name: string): void => {
      const asChild = attribute(opening, 'asChild');
      if (asChild !== null) {
        reportOther(asChild, name, 'asChild', 'Use `render={<Child />}`');
      }
      switch (name) {
        case 'Accordion':
        case 'ToggleGroup': {
          const type = attribute(opening, 'type');
          if (type !== null) {
            reportOther(type, name, 'type', 'Use the `multiple` boolean');
          }
          const collapsible = attribute(opening, 'collapsible');
          if (collapsible !== null) {
            reportOther(collapsible, name, 'collapsible', 'A single item already collapses');
          }
          for (const prop of VALUE_PROPS) {
            const value = attribute(opening, prop);
            if (value !== null && isStringLiteral(value)) {
              context.report({ data: { attr: prop, name }, messageId: 'stringValue', node: value });
            }
          }
          break;
        }
        case 'SelectContent': {
          const position = attribute(opening, 'position');
          if (position !== null) {
            reportOther(position, name, 'position', 'Use `alignItemWithTrigger`');
          }
          break;
        }
        case 'Slider': {
          for (const prop of VALUE_PROPS) {
            const value = attribute(opening, prop);
            if (value !== null && isSingleArray(value)) {
              context.report({ data: { attr: prop }, messageId: 'singleArray', node: value });
            }
          }
          break;
        }
        default:
      }
    };

    const checkRadix = (opening: ESTree.JSXOpeningElement, name: string): void => {
      const render = attribute(opening, 'render');
      if (render !== null && isElementRender(render)) {
        reportOther(render, name, 'render', 'Use `asChild` with the element as the child');
      }
      switch (name) {
        case 'Accordion':
        case 'ToggleGroup': {
          const multiple = attribute(opening, 'multiple');
          if (multiple !== null) {
            reportOther(multiple, name, 'multiple', 'Use `type="multiple"`');
          }
          if (
            name === 'Accordion' &&
            attribute(opening, 'type') === null &&
            !hasSpreadAttribute(opening)
          ) {
            context.report({ messageId: 'missingType', node: opening });
          }
          break;
        }
        case 'Select': {
          for (const attr of ['multiple', 'itemToStringValue']) {
            const found = attribute(opening, attr);
            if (found !== null) {
              reportOther(found, name, attr, 'Radix `Select` is single-select over string values');
            }
          }
          break;
        }
        case 'SelectContent': {
          const align = attribute(opening, 'alignItemWithTrigger');
          if (align !== null) {
            reportOther(align, name, 'alignItemWithTrigger', 'Use `position`');
          }
          break;
        }
        case 'Slider': {
          for (const prop of VALUE_PROPS) {
            const value = attribute(opening, prop);
            if (value !== null && isNumberLiteral(value)) {
              context.report({ data: { attr: prop }, messageId: 'numberValue', node: value });
            }
          }
          break;
        }
        default:
      }
    };

    return {
      JSXElement(node) {
        const opening = node.openingElement;
        const name = elementName(opening);
        if (name === null) {
          return;
        }
        if (attribute(opening, 'asChild') !== null && attribute(opening, 'render') !== null) {
          context.report({ data: { name }, messageId: 'bothApis', node: opening });
          return;
        }
        if (readBase() === 'base') {
          checkBase(opening, name);
        } else {
          checkRadix(opening, name);
        }
      },
    };
  },
  meta: {
    defaultOptions: [{ base: 'base' }],
    docs: {
      description:
        "Disallow props from the other primitive base: Radix's asChild, type and position under Base UI, or Base UI's render, multiple and alignItemWithTrigger under Radix.",
    },
    messages: {
      bothApis:
        '`{{name}}` carries both `asChild` and `render`; a project has one composition API, set by the `base` in `components.json`.',
      missingType: 'Radix `Accordion` requires `type="single"` or `type="multiple"`.',
      numberValue:
        '`{{attr}}={n}` on `Slider` is the Base UI shape; Radix takes an array of thumbs.',
      otherApi:
        '`{{attr}}` on `{{name}}` is the {{other}} API; this project composes shadcn on `{{base}}`. {{fix}}.',
      singleArray:
        '`{{attr}}={[n]}` on `Slider` is the Radix shape; Base UI takes a plain number for one thumb.',
      stringValue:
        '`{{attr}}` on `{{name}}` is a string; Base UI takes an array (`{{attr}}={["…"]}`).',
    },
    schema: [
      {
        additionalProperties: false,
        properties: { base: { enum: [...BASES], type: 'string' } },
        type: 'object',
      },
    ],
    type: 'problem',
  },
});
