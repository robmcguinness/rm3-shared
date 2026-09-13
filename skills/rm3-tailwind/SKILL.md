---
name: rm3-tailwind
description: Provides Tailwind CSS guidance. Triggers when the user asks about Tailwind CSS utility classes, responsive design with Tailwind, component styling patterns, layout utilities, spacing, typography, color palettes, dark mode, hover/focus states, custom configuration, or migrating to Tailwind v4. Also triggers when writing or reviewing JSX/HTML that uses Tailwind class names.
metadata:
  tags: tailwindcss, css, styling, responsive
---

## When to use

Use this skill when answering questions about Tailwind CSS, writing components styled with Tailwind utility classes, or reviewing Tailwind-based code.

## Tailwind CSS Best Practices (v4)

### 1. Use theme variables instead of arbitrary values

Define design tokens in CSS with `@theme` so they generate real utilities project-wide. Colors, fonts, breakpoints, shadows, and spacing belong here — not scattered as bracket values.

```css
@import "tailwindcss";
@theme {
    --color-brand-500: oklch(0.62 0.18 252);
    --font-display: "Satoshi", sans-serif;
    --shadow-soft: 0 12px 40px rgb(15 23 42 / 0.14);
    --breakpoint-3xl: 120rem;
}
```

This gives you utilities like `bg-brand-500`, `font-display`, `shadow-soft`, and `3xl:grid-cols-4`. If a value shows up more than once, promote it to `@theme` rather than repeating bracket syntax.

### 2. Think in utility classes first

Reach for utility classes before writing custom CSS. Long class lists in markup are normal and usually easier to scan than bouncing between HTML and a separate stylesheet. Teams often reach for custom CSS the moment a class attribute feels "too long" — resist that impulse.

### 3. Extract components, not `@apply` classes

When duplication appears, extract a reusable component (template partial, React component, Blade component, etc.) rather than hiding utilities behind `@apply`. The component approach preserves the utility-first model and keeps styling visible at the usage site.

`@apply` has its place — bridging Tailwind with CSS you can't express in markup, or styling third-party markup you don't control — but it's a poor default for everyday component styling.

### 4. Keep class lists readable with tooling

Use [Tailwind CSS IntelliSense](https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss) for autocomplete and linting, and Tailwind's Prettier plugin for automatic class sorting. This gives predictable class order, cleaner diffs, and fewer debates about formatting.

### 5. Use variants for states, themes, and responsive behavior

Lean on built-in variants instead of writing custom CSS:

- `hover:`, `focus:`, `disabled:` for interactive states
- Responsive prefixes (`sm:`, `md:`, `lg:`, etc.) for layout changes
- `dark:` for theme differences
- `data-*` and `aria-*` variants when component state lives in attributes

### 6. Write custom CSS only when utilities aren't the right tool

Good reasons to step outside utilities:

- Styling third-party markup you don't control
- Defining a truly reusable custom utility with `@utility`
- Targeting selectors or pseudo-elements that would be awkward inline

```css
@import "tailwindcss";
@utility content-auto {
    content-visibility: auto;
}
```

### 7. Understand Preflight before disabling it

Preflight is Tailwind's base reset layer. If buttons, headings, lists, or borders look different after installing Tailwind, Preflight is usually why. The best move is usually to understand what changed and override the specific area you care about — turning it off globally should be a deliberate compatibility decision.

## Enforced by lint

Two practices are not written out here because the `rm3-tailwind` oxlint plugin
(`packages/lint/src/tailwind.ts`) rejects them:

- `rm3-tailwind/no-arbitrary-values`: no `bg-[#fff]` / `p-[13px]`; arbitrary values pass only on
  `h-`, `w-`, `min-h-`, `max-h-`, `min-w-`, `max-w-`.
- `rm3-tailwind/no-dynamic-class-names`: no `bg-${color}-600` or `'text-' + size`; write each
  complete class as a literal and select between them.
