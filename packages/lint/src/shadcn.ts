import { eslintCompatPlugin } from '@oxlint/plugins';

import { noConditionalClassTemplateRule } from './rules/no-conditional-class-template.ts';
import { noDarkColorOverridesRule } from './rules/no-dark-color-overrides.ts';
import { noIconSizeClassesRule } from './rules/no-icon-size-classes.ts';
import { noOverlayZIndexRule } from './rules/no-overlay-z-index.ts';
import { noPaletteColorsRule } from './rules/no-palette-colors.ts';
import { noRawInputInInputGroupRule } from './rules/no-raw-input-in-input-group.ts';
import { noSpaceUtilitiesRule } from './rules/no-space-utilities.ts';
import { noUngroupedItemsRule } from './rules/no-ungrouped-items.ts';
import { preferSizeUtilityRule } from './rules/prefer-size-utility.ts';
import { preferTruncateRule } from './rules/prefer-truncate.ts';
import { requireIconDataIconRule } from './rules/require-icon-data-icon.ts';
import { requirePartsRule } from './rules/require-parts.ts';

/**
 * shadcn/ui rules from `skills/rm3-shadcn`, one per numbered practice a
 * linter can check from JSX and class strings. A separate plugin from
 * `rm3-tailwind` because these are shadcn's opinions (no `dark:` color
 * overrides, component composition), not Tailwind's; `shadcnRulesOff` in
 * `@rm3/oxlint-config` turns them off by name over vendored primitives.
 */
const rm3ShadcnPlugin = eslintCompatPlugin({
  meta: { name: 'rm3-shadcn' },
  rules: {
    'no-conditional-class-template': noConditionalClassTemplateRule,
    'no-dark-color-overrides': noDarkColorOverridesRule,
    'no-icon-size-classes': noIconSizeClassesRule,
    'no-overlay-z-index': noOverlayZIndexRule,
    'no-palette-colors': noPaletteColorsRule,
    'no-raw-input-in-input-group': noRawInputInInputGroupRule,
    'no-space-utilities': noSpaceUtilitiesRule,
    'no-ungrouped-items': noUngroupedItemsRule,
    'prefer-size-utility': preferSizeUtilityRule,
    'prefer-truncate': preferTruncateRule,
    'require-icon-data-icon': requireIconDataIconRule,
    'require-parts': requirePartsRule,
  },
});

export default rm3ShadcnPlugin;

// A variable type annotation (not a cast) for the same reason as
// `antiSlopRules`: every value stays the literal `'error'` while the object
// remains the mutable shape oxlint's `Config['rules']` accepts.
export const shadcnCustomRules: {
  'rm3-shadcn/no-conditional-class-template': 'error';
  'rm3-shadcn/no-dark-color-overrides': 'error';
  'rm3-shadcn/no-icon-size-classes': 'error';
  'rm3-shadcn/no-overlay-z-index': 'error';
  'rm3-shadcn/no-palette-colors': 'error';
  'rm3-shadcn/no-raw-input-in-input-group': 'error';
  'rm3-shadcn/no-space-utilities': 'error';
  'rm3-shadcn/no-ungrouped-items': 'error';
  'rm3-shadcn/prefer-size-utility': 'error';
  'rm3-shadcn/prefer-truncate': 'error';
  'rm3-shadcn/require-icon-data-icon': 'error';
  'rm3-shadcn/require-parts': 'error';
} = {
  // SKILL.md 6: a condition spliced into a class string; `cn()` takes it.
  'rm3-shadcn/no-conditional-class-template': 'error',
  // SKILL.md 5: semantic tokens already carry a dark value.
  'rm3-shadcn/no-dark-color-overrides': 'error',
  // SKILL.md 12: the component sizes its icons through CSS.
  'rm3-shadcn/no-icon-size-classes': 'error',
  // SKILL.md 10: overlay primitives manage their own stacking.
  'rm3-shadcn/no-overlay-z-index': 'error',
  // SKILL.md 4: semantic tokens, never the raw palette.
  'rm3-shadcn/no-palette-colors': 'error',
  // SKILL.md 9: `InputGroup` takes `InputGroupInput` / `InputGroupTextarea`.
  'rm3-shadcn/no-raw-input-in-input-group': 'error',
  // SKILL.md 1: `flex gap-*`, not `space-*`.
  'rm3-shadcn/no-space-utilities': 'error',
  // SKILL.md 7: items sit inside their Group.
  'rm3-shadcn/no-ungrouped-items': 'error',
  // SKILL.md 2: `size-*` when width and height match.
  'rm3-shadcn/prefer-size-utility': 'error',
  // SKILL.md 3: `truncate` over its three-utility expansion.
  'rm3-shadcn/prefer-truncate': 'error',
  // SKILL.md 11: an icon beside text in a `Button` carries `data-icon`.
  'rm3-shadcn/require-icon-data-icon': 'error',
  // SKILL.md 8: overlays need a Title; `Avatar` needs a Fallback.
  'rm3-shadcn/require-parts': 'error',
};
