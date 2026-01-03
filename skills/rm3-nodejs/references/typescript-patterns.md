# TypeScript Patterns

## Prefer `unknown` Over `any`

```ts
function parse(data: unknown) {
  if (typeof data === "string") {
    return data.toUpperCase();
  }
}
```

`unknown` forces validation before use; `any` silently disables type checking and leaks into callers.

## Let Type Inference Do the Work

```ts
const name = "Ada"; // inferred as "Ada"
```

Not:

```ts
const name: string = "Ada"; // widens to string, hurts inference
```

Over-annotation widens types, hurts downstream inference, and creates maintenance overhead. Annotate at boundaries (function params, return types), not inside function bodies.

## Prefer `satisfies` Over `as`

```ts
const routes = {
  home: "/",
  about: "/about",
} satisfies Record<string, string>;
```

Not:

```ts
const routes = {
  home: "/",
  about: "/about",
} as Record<string, string>; // suppresses errors, loses literal inference
```

`satisfies` validates the shape without widening the type or hiding errors.

## Derive Types From Values

```ts
const roles = ["admin", "user", "guest"] as const;
type Role = (typeof roles)[number];
```

Keeping runtime values and types in sync manually drifts over time. Derive types from the source of truth.

## Model Impossible States With Discriminated Unions

```ts
type State =
  | { status: "loading" }
  | { status: "success"; data: User }
  | { status: "error"; error: Error };
```

Avoids optional-property blobs where invalid combinations are representable.

## Exhaustive Checks With `never`

```ts
function assertNever(value: never): never {
  throw new Error(`Unhandled case: ${JSON.stringify(value)}`);
}

switch (state.status) {
  case "loading": ...
  case "success": ...
  case "error": ...
  default: return assertNever(state);
}
```

Future variants added to the union become compiler errors instead of silent runtime bugs.

## `as const` for Configuration and Constants

```ts
const theme = { mode: "dark" } as const;
// theme.mode is "dark", not string
```

Without `as const`, object literals widen to mutable types with broad primitive types.

## Type Predicates for Reusable Narrowing

```ts
function isUser(value: unknown): value is User {
  return typeof value === "object" && value !== null && "id" in value;
}

if (isUser(data)) {
  data.id; // User
}
```

Centralizes runtime checks and connects them to compile-time narrowing.

## Build New Types From Existing Types

```ts
type UserPreview = Pick<User, "id" | "name">;
type PartialUser = Partial<User>;
type RequiredUser = Required<User>;
type WithoutPassword = Omit<User, "password">;
```

Prefer utility types and indexed access over duplicating type definitions manually.

## Validate External Data at Runtime

TypeScript does not validate API responses — type assertions are lies at runtime boundaries.

```ts
const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
});

const user = UserSchema.parse(await response.json());
```

Type safety ends at runtime boundaries unless you validate with a library like Zod.

## Avoid `enum`

```ts
// Prefer:
const roles = ["admin", "user"] as const;
type Role = (typeof roles)[number];

// Over:
enum Role { Admin, User }
```

Literal unions are easier to serialize, simpler to refactor, and produce no unexpected runtime output.

## Prefer Generics That Infer Automatically

```ts
// Better — schema drives the generic:
getData(userSchema);

// Less ideal — caller must annotate:
getData<User>();
```

Well-designed generics infer from arguments rather than requiring manual type parameters.

## Template Literal Types

```ts
type Route = `/api/${string}`;
type EventName = `on${Capitalize<string>}`;
```

Useful for routes, event names, CSS utilities, design system tokens, and query keys.

## Enable Strict Compiler Options

```json
{
  "strict": true,
  "noUncheckedIndexedAccess": true,
  "exactOptionalPropertyTypes": true
}
```

`strict` enables `strictNullChecks`, `noImplicitAny`, and several others. `noUncheckedIndexedAccess` catches array index assumptions. `exactOptionalPropertyTypes` distinguishes `{ x?: string }` from `{ x: string | undefined }`.

## TypeScript ≠ Runtime Safety

```ts
// Compiles, may still explode:
const user = (await response.json()) as User;
```

TypeScript improves correctness. It does not replace runtime validation, does not guarantee good architecture, and does not eliminate runtime bugs. Validate at every system boundary.
