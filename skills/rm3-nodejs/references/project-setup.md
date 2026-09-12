# Project Setup

## Contents
- [Package.json Configuration](#packagejson-configuration)
- [Top-Level Await](#top-level-await)
- [Subpath Imports](#subpath-imports)

> Native TypeScript execution, tsconfig.json, type-stripping rules, `--env-file`, and ESM module patterns (node: prefix, file extensions, barrel exports) are covered by the global `node` skill. Load it alongside this one.

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