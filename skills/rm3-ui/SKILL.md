---
name: rm3-ui
description: Provides Tailwind CSS v4 practice for styling React components, including shadcn/ui compositions. Triggers when writing or reviewing JSX that uses Tailwind utility classes, responsive, dark or state variants, @theme tokens, or Tailwind v4 migration, and when composing React components from shadcn/ui primitives (Button, Dialog, Select, Field, InputGroup, Avatar, Tabs) or working in a project with a components.json file.
metadata:
  tags: tailwindcss, shadcn, react, css, styling
---

## Prerequisite

Load the global `shadcn` skill first for CLI use, registries, presets, component selection and
the full composition rules with their Incorrect/Correct pairs. This skill does not repeat them;
it adds Tailwind practice on top.

## When to use

Use this skill when styling components with Tailwind utility classes, answering Tailwind
questions, or reviewing JSX built from shadcn/ui primitives.

## Tailwind practices

### Theme tokens, not arbitrary values

Define design tokens in CSS with `@theme` so they generate real utilities project-wide. A value
that shows up more than once is a token, not a bracket.

```css
@import "tailwindcss";
@theme {
    --color-brand-500: oklch(0.62 0.18 252);
    --font-display: "Satoshi", sans-serif;
    --breakpoint-3xl: 120rem;
}
```

This yields `bg-brand-500`, `font-display` and `3xl:grid-cols-4`.

### Extract components, not `@apply` classes

When duplication appears, extract a React component rather than hiding utilities behind
`@apply`. `@apply` is for bridging Tailwind with CSS you cannot express in markup, or for styling
third-party markup you do not control.

### Variants for state, theme and responsive behavior

`hover:`, `focus:`, `disabled:` for interactive states; `sm:`, `md:`, `lg:` for layout changes;
`dark:` for theme differences outside the semantic tokens; `data-*` and `aria-*` variants when
component state lives in attributes.

### Custom CSS only when utilities are not the right tool

Third-party markup, a reusable custom utility with `@utility`, or a selector or pseudo-element
that would be awkward inline.

```css
@utility content-auto {
    content-visibility: auto;
}
```

### Class order and Preflight

Class order is `oxfmt`'s job (`sortTailwindcss`); do not hand-sort or add a Prettier plugin.
Preflight is Tailwind's base reset; if buttons, headings or lists look different after
installing Tailwind, override the specific area rather than disabling it globally.
