import { readStringArrayOption } from '#shared/class-strings.ts';
import { attribute } from '#shared/jsx.ts';

import type { ESTree } from '@oxlint/plugins';

/**
 * How the icon rules recognize an icon element: a `data-icon` attribute, or
 * a name shaped like the icon library's exports. Lucide's `SearchIcon` alias
 * is the default; a Tabler project sets `iconPrefixes: ['Icon']`.
 */
export const ICON_SCHEMA_PROPERTIES = {
  iconNames: { items: { type: 'string' }, type: 'array', uniqueItems: true },
  iconPrefixes: { items: { type: 'string' }, type: 'array', uniqueItems: true },
  iconSuffixes: { items: { type: 'string' }, type: 'array', uniqueItems: true },
} as const;

const DEFAULT_NAMES: readonly string[] = ['Spinner'];
const DEFAULT_PREFIXES: readonly string[] = [];
const DEFAULT_SUFFIXES: readonly string[] = ['Icon'];

interface IconShape {
  names: ReadonlySet<string>;
  prefixes: readonly string[];
  suffixes: readonly string[];
}

function readShape(option?: unknown): IconShape {
  return {
    names: new Set(readStringArrayOption(option, 'iconNames', DEFAULT_NAMES)),
    prefixes: readStringArrayOption(option, 'iconPrefixes', DEFAULT_PREFIXES),
    suffixes: readStringArrayOption(option, 'iconSuffixes', DEFAULT_SUFFIXES),
  };
}

export type IconMatcher = (name: string, node: ESTree.JSXOpeningElement) => boolean;

/** An icon matcher for `createOnce`, rebuilt only when the option changes identity. */
export function createIconMatcher(readOption: () => unknown): IconMatcher {
  let cachedFor: unknown = Symbol('unset');
  let shape = readShape();
  return (name, node) => {
    const option = readOption();
    if (option !== cachedFor) {
      cachedFor = option;
      shape = readShape(option);
    }
    if (attribute(node, 'data-icon') !== null || shape.names.has(name)) {
      return true;
    }
    return (
      shape.suffixes.some((suffix) => name.length > suffix.length && name.endsWith(suffix)) ||
      shape.prefixes.some((prefix) => name.length > prefix.length && name.startsWith(prefix))
    );
  };
}
