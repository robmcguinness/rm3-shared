---
name: rm3-shadcn
description: Provides shadcn/ui composition and styling guidance. Triggers when writing or reviewing React components built from shadcn/ui primitives (Button, Dialog, Select, DropdownMenu, Field, InputGroup, Avatar, Tabs), when styling them with Tailwind class names, or when a project has a components.json file.
metadata:
  tags: shadcn, react, tailwindcss, components
---

## When to use

Use this skill when composing UI from shadcn/ui components or reviewing code that does. It lists
only the practices a linter can check from the AST; the global `shadcn` skill remains the full
reference for CLI use, registries, presets and component selection.

Every numbered practice below is enforced by a rule of the same number in the `rm3-shadcn` oxlint
plugin (`packages/lint/src/shadcn.ts`). The rules are off over vendored primitives
(`components/ui/**`) through `shadcnRulesOff` in `@rm3/oxlint-config`, because `shadcn add`
regenerates those files.

## shadcn practices a linter can check

### 1. No `space-x-*` or `space-y-*`

Use `flex` with `gap-*`. For vertical stacks, `flex flex-col gap-*`.

```tsx
// DON'T
<div className="space-y-4">
// DO
<div className="flex flex-col gap-4">
```

Rule: `rm3-shadcn/no-space-utilities`.

### 2. Use `size-*` when width and height are equal

`size-10`, not `w-10 h-10`. Applies to icons, avatars, skeletons and anything square.

```tsx
// DON'T
<Avatar className="w-10 h-10">
// DO
<Avatar className="size-10">
```

Rule: `rm3-shadcn/prefer-size-utility`.

### 3. Use the `truncate` shorthand

`truncate`, not `overflow-hidden text-ellipsis whitespace-nowrap`.

Rule: `rm3-shadcn/prefer-truncate`.

### 4. Semantic colors, never the raw palette

Use `bg-primary`, `text-muted-foreground`, `text-destructive`, or a `@theme` token of your own.
Never `bg-blue-500`, `text-gray-600`, `text-emerald-600`. For status indicators use `Badge`
variants or a semantic token.

```tsx
// DON'T
<span className="text-emerald-600">+20.1%</span>
// DO
<Badge variant="secondary">+20.1%</Badge>
```

Rule: `rm3-shadcn/no-palette-colors`.

### 5. No manual `dark:` color overrides

Semantic tokens already switch with the theme through CSS variables. `bg-background
text-foreground`, not `bg-white dark:bg-gray-950`.

Rule: `rm3-shadcn/no-dark-color-overrides`.

### 6. Use `cn()` for conditional classes

Do not write ternaries or `&&` inside a `className` template literal; pass the pieces to `cn()`.

```tsx
// DON'T
<div className={`flex items-center ${isActive ? "bg-primary" : "bg-muted"}`}>
// DO
<div className={cn("flex items-center", isActive ? "bg-primary" : "bg-muted")}>
```

Rule: `rm3-shadcn/no-conditional-class-template`.

### 7. Items always inside their Group

Never render an item directly inside its content container.

| Item | Container | Wrap in |
| --- | --- | --- |
| `SelectItem`, `SelectLabel` | `SelectContent` | `SelectGroup` |
| `DropdownMenuItem`, `DropdownMenuLabel`, `DropdownMenuSub` | `DropdownMenuContent`, `DropdownMenuSubContent` | `DropdownMenuGroup` |
| `MenubarItem` | `MenubarContent` | `MenubarGroup` |
| `ContextMenuItem` | `ContextMenuContent` | `ContextMenuGroup` |
| `CommandItem` | `Command`, `CommandList`, `CommandDialog` | `CommandGroup` |
| `TabsTrigger` | `Tabs` | `TabsList` |
| `MessageScrollerItem` | `MessageScroller`, `MessageScrollerViewport` | `MessageScrollerContent` |

```tsx
// DON'T
<SelectContent>
  <SelectItem value="apple">Apple</SelectItem>
</SelectContent>
// DO
<SelectContent>
  <SelectGroup>
    <SelectItem value="apple">Apple</SelectItem>
  </SelectGroup>
</SelectContent>
```

Rule: `rm3-shadcn/no-ungrouped-items`.

### 8. Dialog, Sheet, Drawer and AlertDialog need a Title; Avatar needs a Fallback

`DialogTitle`, `SheetTitle`, `DrawerTitle` and `AlertDialogTitle` are required for accessibility;
use `className="sr-only"` if the title is visually hidden. `Avatar` always carries an
`AvatarFallback` for when the image fails to load.

```tsx
<DialogContent>
  <DialogHeader>
    <DialogTitle>Edit profile</DialogTitle>
  </DialogHeader>
</DialogContent>

<Avatar>
  <AvatarImage src={src} alt={name} />
  <AvatarFallback>JD</AvatarFallback>
</Avatar>
```

Rule: `rm3-shadcn/require-parts`.

### 9. `InputGroup` takes `InputGroupInput` / `InputGroupTextarea`

Never a raw `Input` or `Textarea` inside an `InputGroup`.

```tsx
// DON'T
<InputGroup><Input placeholder="Search..." /></InputGroup>
// DO
<InputGroup><InputGroupInput placeholder="Search..." /></InputGroup>
```

Rule: `rm3-shadcn/no-raw-input-in-input-group`.

### 10. No manual `z-index` on overlay components

`DialogContent`, `SheetContent`, `DrawerContent`, `AlertDialogContent`, `DropdownMenuContent`,
`PopoverContent`, `TooltipContent`, `HoverCardContent` and the other overlay surfaces manage their
own stacking. Never add `z-50` or `z-[999]` to them.

Rule: `rm3-shadcn/no-overlay-z-index`.

### 11. Icons in `Button` use `data-icon`

An icon next to text inside a `Button` carries `data-icon="inline-start"` or
`data-icon="inline-end"`. An icon-only button (`size="icon"`) does not.

```tsx
<Button>
  <SearchIcon data-icon="inline-start" />
  Search
</Button>
```

Rule: `rm3-shadcn/require-icon-data-icon`.

### 12. No sizing classes on icons inside components

`Button`, `DropdownMenuItem`, `Alert`, `Badge`, `Sidebar*` and the other primitives size their
icons through CSS. No `size-4` or `w-4 h-4` on an icon inside them.

```tsx
// DON'T
<Button><SearchIcon className="size-4" data-icon="inline-start" /> Search</Button>
// DO
<Button><SearchIcon data-icon="inline-start" /> Search</Button>
```

Rule: `rm3-shadcn/no-icon-size-classes`.

## Not lint rules

- `Button` has no `isLoading` / `isPending`: already a type error under `typeCheck`.
- "Use `Alert` / `Empty` / `Badge` / `Skeleton` / `Separator` / `ToggleGroup` instead of custom
  markup": intent, not syntax. A bordered `div` is not knowably a separator.
- Toast per base (`toast` component for Base UI, `sonner` otherwise): depends on what is
  installed; every rm3 project currently ships `sonner`.
- `asChild` (Radix) vs `render` (Base UI): depends on the consumer's `components.json` `base`.
- `FieldGroup` + `Field` over `div` layout: covered as far as syntax allows by practice 1.
