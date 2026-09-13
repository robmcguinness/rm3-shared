import { eslintCompatPlugin } from '@oxlint/plugins';

import { noBaseApiMismatchRule } from './rules/no-base-api-mismatch.ts';
import { noButtonLoadingPropRule } from './rules/no-button-loading-prop.ts';
import { noConditionalClassTemplateRule } from './rules/no-conditional-class-template.ts';
import { noDarkColorOverridesRule } from './rules/no-dark-color-overrides.ts';
import { noIconSizeClassesRule } from './rules/no-icon-size-classes.ts';
import { noOverlayZIndexRule } from './rules/no-overlay-z-index.ts';
import { noPaletteColorsRule } from './rules/no-palette-colors.ts';
import { noPositionedInputAddonRule } from './rules/no-positioned-input-addon.ts';
import { noRawInputInInputGroupRule } from './rules/no-raw-input-in-input-group.ts';
import { noSpaceUtilitiesRule } from './rules/no-space-utilities.ts';
import { noUngroupedItemsRule } from './rules/no-ungrouped-items.ts';
import { noWrappedTriggerRule } from './rules/no-wrapped-trigger.ts';
import { preferMarkerRule } from './rules/prefer-marker.ts';
import { preferSeparatorRule } from './rules/prefer-separator.ts';
import { preferSizeUtilityRule } from './rules/prefer-size-utility.ts';
import { preferSkeletonRule } from './rules/prefer-skeleton.ts';
import { preferTruncateRule } from './rules/prefer-truncate.ts';
import { requireFieldStatePairingRule } from './rules/require-field-state-pairing.ts';
import { requireIconDataIconRule } from './rules/require-icon-data-icon.ts';
import { requireNativeButtonFalseRule } from './rules/require-native-button-false.ts';
import { requirePartsRule } from './rules/require-parts.ts';

/**
 * shadcn/ui rules, one per practice in the global `shadcn` skill's
 * `rules/*.md` a linter can check from JSX and class strings. A separate
 * plugin from `rm3-tailwind` because these are shadcn's opinions (no `dark:` color
 * overrides, component composition), not Tailwind's; `shadcnRulesOff` in
 * `@rm3/oxlint-config` turns them off by name over vendored primitives.
 */
const rm3ShadcnPlugin = eslintCompatPlugin({
  meta: { name: 'rm3-shadcn' },
  rules: {
    'no-base-api-mismatch': noBaseApiMismatchRule,
    'no-button-loading-prop': noButtonLoadingPropRule,
    'no-conditional-class-template': noConditionalClassTemplateRule,
    'no-dark-color-overrides': noDarkColorOverridesRule,
    'no-icon-size-classes': noIconSizeClassesRule,
    'no-overlay-z-index': noOverlayZIndexRule,
    'no-palette-colors': noPaletteColorsRule,
    'no-positioned-input-addon': noPositionedInputAddonRule,
    'no-raw-input-in-input-group': noRawInputInInputGroupRule,
    'no-space-utilities': noSpaceUtilitiesRule,
    'no-ungrouped-items': noUngroupedItemsRule,
    'no-wrapped-trigger': noWrappedTriggerRule,
    'prefer-marker': preferMarkerRule,
    'prefer-separator': preferSeparatorRule,
    'prefer-size-utility': preferSizeUtilityRule,
    'prefer-skeleton': preferSkeletonRule,
    'prefer-truncate': preferTruncateRule,
    'require-field-state-pairing': requireFieldStatePairingRule,
    'require-icon-data-icon': requireIconDataIconRule,
    'require-native-button-false': requireNativeButtonFalseRule,
    'require-parts': requirePartsRule,
  },
});

export default rm3ShadcnPlugin;

// A variable type annotation (not a cast) for the same reason as
// `antiSlopRules`: every value stays the literal `'error'` while the object
// remains the mutable shape oxlint's `Config['rules']` accepts.
export const shadcnCustomRules: {
  'rm3-shadcn/no-base-api-mismatch': 'error';
  'rm3-shadcn/no-button-loading-prop': 'error';
  'rm3-shadcn/no-conditional-class-template': 'error';
  'rm3-shadcn/no-dark-color-overrides': 'error';
  'rm3-shadcn/no-icon-size-classes': 'error';
  'rm3-shadcn/no-overlay-z-index': 'error';
  'rm3-shadcn/no-palette-colors': 'error';
  'rm3-shadcn/no-positioned-input-addon': 'error';
  'rm3-shadcn/no-raw-input-in-input-group': 'error';
  'rm3-shadcn/no-space-utilities': 'error';
  'rm3-shadcn/no-ungrouped-items': 'error';
  'rm3-shadcn/no-wrapped-trigger': 'error';
  'rm3-shadcn/prefer-marker': 'error';
  'rm3-shadcn/prefer-separator': 'error';
  'rm3-shadcn/prefer-size-utility': 'error';
  'rm3-shadcn/prefer-skeleton': 'error';
  'rm3-shadcn/prefer-truncate': 'error';
  'rm3-shadcn/require-field-state-pairing': 'error';
  'rm3-shadcn/require-icon-data-icon': 'error';
  'rm3-shadcn/require-native-button-false': 'error';
  'rm3-shadcn/require-parts': 'error';
} = {
  // base-vs-radix.md: one composition API per project, set by `base`.
  'rm3-shadcn/no-base-api-mismatch': 'error',
  // composition.md: `Button` has no loading prop; `Spinner` + `disabled`.
  'rm3-shadcn/no-button-loading-prop': 'error',
  // styling.md: a condition spliced into a class string; `cn()` takes it.
  'rm3-shadcn/no-conditional-class-template': 'error',
  // styling.md: semantic tokens already carry a dark value.
  'rm3-shadcn/no-dark-color-overrides': 'error',
  // icons.md: the component sizes its icons through CSS.
  'rm3-shadcn/no-icon-size-classes': 'error',
  // styling.md: overlay primitives manage their own stacking.
  'rm3-shadcn/no-overlay-z-index': 'error',
  // styling.md: semantic tokens, never the raw palette.
  'rm3-shadcn/no-palette-colors': 'error',
  // forms.md: an addon over an `Input` is `InputGroup` + `InputGroupAddon`.
  'rm3-shadcn/no-positioned-input-addon': 'error',
  // forms.md: `InputGroup` takes `InputGroupInput` / `InputGroupTextarea`.
  'rm3-shadcn/no-raw-input-in-input-group': 'error',
  // styling.md: `flex gap-*`, not `space-*`.
  'rm3-shadcn/no-space-utilities': 'error',
  // composition.md: items sit inside their Group.
  'rm3-shadcn/no-ungrouped-items': 'error',
  // base-vs-radix.md: no `div` between a trigger and its child.
  'rm3-shadcn/no-wrapped-trigger': 'error',
  // chat.md: a label between `Separator`s is a `Marker`.
  'rm3-shadcn/prefer-marker': 'error',
  // composition.md: `<hr>` and an empty `border-t` div are `Separator`.
  'rm3-shadcn/prefer-separator': 'error',
  // styling.md: `size-*` when width and height match.
  'rm3-shadcn/prefer-size-utility': 'error',
  // composition.md: `animate-pulse` on a div is `Skeleton`.
  'rm3-shadcn/prefer-skeleton': 'error',
  // styling.md: `truncate` over its three-utility expansion.
  'rm3-shadcn/prefer-truncate': 'error',
  // forms.md: `data-invalid` on `Field` pairs with `aria-invalid` on the control.
  'rm3-shadcn/require-field-state-pairing': 'error',
  // icons.md: an icon beside text in a `Button` carries `data-icon`.
  'rm3-shadcn/require-icon-data-icon': 'error',
  // base-vs-radix.md: `render={<a />}` on a button needs `nativeButton={false}`.
  'rm3-shadcn/require-native-button-false': 'error',
  // composition.md: overlays need a Title; `Avatar` needs a Fallback.
  'rm3-shadcn/require-parts': 'error',
};
