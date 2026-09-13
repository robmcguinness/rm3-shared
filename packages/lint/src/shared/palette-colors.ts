/**
 * Utilities that take a color. Longer prefixes sit after their shorter
 * cousins on purpose: `border-` does not match `border-x-red-500` (the rest,
 * `x-red-500`, is not a palette value), so the loop reaches `border-x-`.
 */
const COLOR_UTILITY_PREFIXES: readonly string[] = [
  'bg-',
  'text-',
  'border-',
  'border-x-',
  'border-y-',
  'border-t-',
  'border-r-',
  'border-b-',
  'border-l-',
  'border-s-',
  'border-e-',
  'ring-',
  'ring-offset-',
  'outline-',
  'fill-',
  'stroke-',
  'from-',
  'via-',
  'to-',
  'decoration-',
  'accent-',
  'caret-',
  'divide-',
  'shadow-',
  'inset-shadow-',
  'placeholder-',
];

/** Tailwind's default palette: `<name>-<shade>`, plus `white` and `black`. */
const PALETTE_VALUE =
  /^(?:red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|slate|gray|zinc|neutral|stone)-(?:50|[1-9]00|950)$/;

export interface PaletteColor {
  /** `bg-` in `bg-red-500`. */
  prefix: string;
  /** `red-500` in `bg-red-500`. */
  value: string;
}

/**
 * The palette color a utility hard-codes, or null when the utility is not a
 * color utility or its value is a semantic token (`bg-primary`,
 * `text-muted-foreground`, `bg-brand-500`). Expects the output of `utilityOf`,
 * so variants, `!` and the opacity modifier are already gone.
 */
export function paletteColorOf(utility: string): PaletteColor | null {
  for (const prefix of COLOR_UTILITY_PREFIXES) {
    if (!utility.startsWith(prefix)) {
      continue;
    }
    const value = utility.slice(prefix.length);
    if (value === 'white' || value === 'black' || PALETTE_VALUE.test(value)) {
      return { prefix, value };
    }
  }
  return null;
}

/** Whether a utility (after `utilityOf`) takes a color at all: `bg-primary`, `text-foreground`. */
export function isColorUtility(utility: string): boolean {
  return COLOR_UTILITY_PREFIXES.some((prefix) => utility.startsWith(prefix));
}
