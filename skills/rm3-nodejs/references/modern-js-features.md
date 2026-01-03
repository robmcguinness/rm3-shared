# Modern JavaScript Features

## Contents
- [Promise.withResolvers()](#promisewithresolvers)
- [structuredClone()](#structuredclone)
- [Iterator Helpers](#iterator-helpers)
- [Set Operations](#set-operations)

---

## Promise.withResolvers()

```typescript
function createDeferred<T>() {
  const { promise, resolve, reject } = Promise.withResolvers<T>();
  return { promise, resolve, reject };
}

const { promise, resolve } = createDeferred<string>();
setTimeout(() => resolve('done'), 1000);
console.log(await promise); // 'done'
```

---

## structuredClone()

```typescript
const original = {
  date: new Date(),
  nested: { array: [1, 2, 3] },
  circular: {} as any
};
original.circular.self = original.circular;

// Deep clone with circular references
const cloned = structuredClone(original);
```

---

## Iterator Helpers

```typescript
const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

// Lazy, memory-efficient transformations
const result = numbers
  .values()
  .filter(n => n % 2 === 0)
  .map(n => n * 2)
  .take(3)
  .toArray();

console.log(result); // [4, 8, 12]
```

---

## Set Operations

```typescript
const a = new Set([1, 2, 3, 4]);
const b = new Set([3, 4, 5, 6]);

a.union(b);              // Set {1, 2, 3, 4, 5, 6}
a.intersection(b);       // Set {3, 4}
a.difference(b);         // Set {1, 2}
a.symmetricDifference(b); // Set {1, 2, 5, 6}
a.isSubsetOf(b);         // false
a.isSupersetOf(b);       // false
a.isDisjointFrom(b);     // false
```

---

## Explicit Resource Management

The `using` declaration automatically disposes resources when they go out of scope via `Symbol.dispose` (sync) or `Symbol.asyncDispose` (async). This prevents resource leaks for database connections, file handles, locks, and similar.

### Sync Disposal

```typescript
class TempFile {
  path: string;

  constructor(path: string) {
    this.path = path;
    writeFileSync(path, '');
  }

  [Symbol.dispose]() {
    unlinkSync(this.path);
  }
}

function processData() {
  using tmp = new TempFile('/tmp/work.dat');
  // Use tmp.path...
  // Automatically cleaned up when function exits (even on throw)
}
```

### Async Disposal

```typescript
class DatabaseConnection {
  async query(sql: string) { /* ... */ }

  async [Symbol.asyncDispose]() {
    await this.close();
  }
}

async function migrateData() {
  await using db = new DatabaseConnection();
  await db.query('INSERT INTO ...');
  // db.close() called automatically
}
```

### DisposableStack for Multiple Resources

```typescript
async function pipeline() {
  await using stack = new AsyncDisposableStack();

  const db = stack.use(new DatabaseConnection());
  const cache = stack.use(new CacheClient());
  const lock = stack.adopt(await acquireLock(), release => release());

  // All resources disposed in reverse order when scope exits
}
```