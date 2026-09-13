import { defineRule } from '@oxlint/plugins';

import { childElements, classTokenMatching, elementName } from '#shared/jsx.ts';

/** Controls that `InputGroup` has a grouped form of. */
const CONTROLS: ReadonlySet<string> = new Set(['Input', 'Textarea']);

/**
 * Report a `relative` host that holds an `Input` / `Textarea` beside an
 * `absolute` element (a button, an icon, a counter); that is a hand-positioned
 * addon, and `InputGroup` + `InputGroupAddon` lay it out with the control's
 * padding, focus ring and text direction (shadcn skill, rules/forms.md
 * "Buttons inside inputs use InputGroup + InputGroupAddon").
 */
export const noPositionedInputAddonRule = defineRule({
  createOnce(context) {
    return {
      JSXElement(node) {
        const host = elementName(node.openingElement);
        if (host === null || !/^[a-z]/.test(host)) {
          return;
        }
        if (classTokenMatching(node.openingElement, (utility) => utility === 'relative') === null) {
          return;
        }
        const children = childElements(node);
        const control = children.find((child) => {
          const name = elementName(child.openingElement);
          return name !== null && CONTROLS.has(name);
        });
        if (control === undefined) {
          return;
        }
        const addon = children.find(
          (child) =>
            child !== control &&
            classTokenMatching(child.openingElement, (utility) => utility === 'absolute') !== null,
        );
        if (addon === undefined) {
          return;
        }
        context.report({
          data: {
            addon: elementName(addon.openingElement) ?? 'element',
            control: elementName(control.openingElement) ?? 'Input',
            host,
          },
          messageId: 'positionedAddon',
          node: node.openingElement,
        });
      },
    };
  },
  meta: {
    docs: {
      description:
        'Disallow an absolutely positioned element over an Input or Textarea inside a relative wrapper; use InputGroup with InputGroupAddon.',
    },
    messages: {
      positionedAddon:
        '`<{{host}} className="relative">` places `{{addon}}` over `{{control}}` by hand, so the control\'s padding, focus ring and text direction do not account for it. Use `InputGroup` with `InputGroup{{control}}` and put `{{addon}}` in `InputGroupAddon`.',
    },
    type: 'problem',
  },
});
