# @rm3/env

Validate environment variables against a Zod schema and get back a frozen, type-safe object.

## Install

This is a private workspace package. Add it to your app's `package.json`:

```json
{
    "dependencies": {
        "@rm3/env": "workspace:*"
    }
}
```

## Pre-loading environment variables

Node's `--env-file` flag loads your `.env` file into `process.env` before any application code runs. Each app passes this flag in its scripts:

```json
{
    "scripts": {
        "dev": "node --env-file=.env src/index.ts",
        "test": "node --env-file=.env --test test/**/*.test.ts"
    }
}
```

Node parses the `.env` file and injects every variable into `process.env` at startup. By the time your application code executes, all variables are already available. No custom loader, no third-party dotenv library.

## Usage

### 1. Define your schema

Create an `env.config.ts` at your app root. Call `createEnv` with your Zod schema and export the result:

```ts
// apps/server/env.config.ts
import { createEnv } from '@rm3/env';
import { z } from 'zod';

export const env = createEnv({
    schema: {
        PORT: z.coerce.number().int().positive().default(3001),
        HOST: z.string().default('0.0.0.0'),
        ENVIRONMENT: z.enum(['development', 'production', 'test']).default('development'),
    },
});
```

`createEnv` reads from `process.env` (already populated by `--env-file`), validates every field against your schema, and returns a frozen, typed object.

### 2. Map the `#env` subpath import

Add a subpath import to your app's `package.json` so any file in the app can reach the config through a short, stable path:

```json
{
    "imports": {
        "#env": "./env.config.ts"
    }
}
```

This is a standard Node.js [subpath import](https://nodejs.org/api/packages.html#subpath-imports). Node resolves `#env` to `./env.config.ts` relative to the nearest `package.json`. No TypeScript path aliases or bundler plugins required.

### 3. Import and use

```ts
import { env } from '#env';

console.log(env.PORT); // number
console.log(env.HOST); // string
console.log(env.ENVIRONMENT); // 'development' | 'production' | 'test'
```

The first module that imports `#env` triggers `createEnv`. Because ES modules cache their exports, every subsequent import gets the same frozen object -- validation runs exactly once.

### Error behavior

If a required variable is missing or fails validation, `createEnv` throws before your app can start:

```
Error: Environment validation failed:
  DATABASE_URL: Required
```

## API

### `createEnv(config)`

```ts
function createEnv<T extends ZodRawShape>(config: EnvConfig<T>): Readonly<ZodInfer<ZodObject<T>>>;
```

**Parameters**

| Name            | Type          | Description                                       |
| --------------- | ------------- | ------------------------------------------------- |
| `config.schema` | `ZodRawShape` | An object of Zod validators, one per env variable |

**Returns** a `Readonly` object containing the parsed and validated values from `process.env`. Each key matches the schema keys; each value has the type Zod infers.

**Throws** `Error` if any variable fails validation. The error message lists every failing field and its Zod issue.

## How it works

Node's `--env-file` flag loads `.env` into `process.env` before any code runs. `createEnv` wraps your schema fields in `z.object()` and calls `safeParse` against `process.env`. If parsing fails, it maps every Zod issue into a readable error string and throws. On success, it freezes the result with `Object.freeze` so no code can mutate it at runtime.

The `#env` subpath import in each app's `package.json` points at the app's `env.config.ts`. Any file that writes `import { env } from '#env'` gets the validated, frozen object. ES module caching guarantees validation runs once, on first import.
