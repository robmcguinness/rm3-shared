# Project Setup & TypeScript Execution

## Contents
- [Package.json Configuration](#packagejson-configuration)
- [Native TypeScript Execution](#native-typescript-execution)
- [Top-Level Await](#top-level-await)
- [Subpath Imports](#subpath-imports)

> TypeScript configuration (tsconfig.json, type stripping rules, enum alternatives) and ESM module patterns (node: prefix, file extensions, barrel exports) are covered by the `node-best-practices` skill.

---

## Package.json Configuration

```json
{
  "name": "my-service",
  "type": "module",
  "engines": { "node": ">=22.18.0" },
  "scripts": {
    "dev": "node --watch --env-file=.env src/index.ts",
    "test": "node --test --watch",
    "test:coverage": "node --test --experimental-test-coverage",
    "start": "node src/index.ts"
  }
}
```

## Native TypeScript Execution

Node.js v22.18.0+ runs `.ts` files directly without flags if using erasable syntax only:

```typescript
// src/index.ts - runs with: node src/index.ts
import { readFile } from 'node:fs/promises';

interface Config {
  port: number;
  host: string;
}

const config: Config = JSON.parse(
  await readFile('config.json', 'utf8')
);

console.log(`Starting on ${config.host}:${config.port}`);
```

**Erasable syntax** includes: type annotations, interfaces, type aliases, generics.
**Non-erasable** (requires `--experimental-transform-types`): `enum`, `namespace`, parameter properties.

---

## Top-Level Await

Use `await` at module level without wrapper functions:

```typescript
import { readFile } from 'node:fs/promises';

// Direct initialization - no IIFE needed
const config = JSON.parse(await readFile('config.json', 'utf8'));
const db = await connectDatabase(config.database);

export { config, db };
```

---

## Subpath Imports

Define internal aliases in package.json:

```json
{
  "imports": {
    "#config": "./src/config/index.js",
    "#utils/*": "./src/utils/*.js",
    "#db": "./src/database/connection.js"
  }
}
```

```typescript
import config from '#config';
import { logger } from '#utils/logger';
import db from '#db';
```