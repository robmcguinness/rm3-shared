# Async Patterns in Modern Node.js

## Contents
- [Iterator Protocol](#iterator-protocol)
- [Async Iterator Protocol](#async-iterator-protocol)
- [Generator Functions](#generator-functions)
- [Async Generators](#async-generators)
- [Event to Iterator Conversion](#event-to-iterator-conversion)
- [Timers Promises API](#timers-promises-api)

> Basic async/await patterns (Promise.all, Promise.allSettled, p-limit concurrency, AbortController, factory functions) are covered by the `node-best-practices` skill.

---

## Iterator Protocol

An object is an **iterator** if it has a `next()` method that returns `{ done: boolean, value: T }`.

```typescript
function createRangeIterator(start: number, end: number): Iterator<number> {
  let current = start;

  return {
    next() {
      if (current > end) {
        return { done: true, value: undefined };
      }
      return { done: false, value: current++ };
    }
  };
}
```

### Iterable Protocol

An object is **iterable** if it has a `[Symbol.iterator]()` method returning an iterator.

```typescript
function createRange(start: number, end: number): Iterable<number> {
  return {
    [Symbol.iterator]() {
      let current = start;
      return {
        next() {
          if (current > end) {
            return { done: true, value: undefined };
          }
          return { done: false, value: current++ };
        }
      };
    }
  };
}

for (const n of createRange(1, 5)) {
  console.log(n); // 1, 2, 3, 4, 5
}

// Spread syntax works with iterables
const arr = [...createRange(1, 3)]; // [1, 2, 3]
```

---

## Async Iterator Protocol

An **async iterator** has a `next()` method returning `Promise<{ done: boolean, value: T }>`.

```typescript
function createAsyncRange(
  start: number,
  end: number,
  delayMs = 100
): AsyncIterable<number> {
  return {
    [Symbol.asyncIterator]() {
      let current = start;
      return {
        async next() {
          await new Promise(resolve => setTimeout(resolve, delayMs));
          if (current > end) {
            return { done: true, value: undefined };
          }
          return { done: false, value: current++ };
        }
      };
    }
  };
}

// Use with for await...of
for await (const n of createAsyncRange(1, 5)) {
  console.log(n);
}
```

---

## Generator Functions

Generators simplify iterator creation:

```typescript
function* range(start: number, end: number): Generator<number> {
  for (let i = start; i <= end; i++) {
    yield i;
  }
}

// Generator is both iterator AND iterable
for (const n of range(1, 3)) {
  console.log(n); // 1, 2, 3
}
```

### Generator Delegation

```typescript
function* concat<T>(...iterables: Iterable<T>[]): Generator<T> {
  for (const iterable of iterables) {
    yield* iterable; // Delegate to another iterable
  }
}

const combined = [...concat([1, 2], [3, 4], [5, 6])];
// [1, 2, 3, 4, 5, 6]
```

### Two-Way Communication

```typescript
function* accumulator(): Generator<number, void, number> {
  let total = 0;
  while (true) {
    const value = yield total;
    total += value;
  }
}

const acc = accumulator();
acc.next();          // { done: false, value: 0 }
acc.next(5);         // { done: false, value: 5 }
acc.next(10);        // { done: false, value: 15 }
```

---

## Async Generators

```typescript
import { setTimeout } from 'node:timers/promises';

async function* countdown(
  from: number,
  delayMs = 1000
): AsyncGenerator<number> {
  for (let i = from; i >= 0; i--) {
    await setTimeout(delayMs);
    yield i;
  }
}

for await (const n of countdown(5)) {
  console.log(n); // 5, 4, 3, 2, 1, 0 (with delays)
}
```

### Pagination Pattern

```typescript
interface PaginatedResponse<T> {
  data: T[];
  nextCursor?: string;
}

async function* paginate<T>(
  fetchFn: (cursor?: string) => Promise<PaginatedResponse<T>>
): AsyncGenerator<T> {
  let cursor: string | undefined;

  do {
    const response = await fetchFn(cursor);
    for (const item of response.data) {
      yield item;
    }
    cursor = response.nextCursor;
  } while (cursor);
}

// Usage
for await (const user of paginate(fetchUsers)) {
  console.log(user.name);
}
```

### Batch Processing with Backpressure

```typescript
async function* batchProcessor<T, R>(
  items: AsyncIterable<T>,
  processFn: (item: T) => Promise<R>,
  concurrency = 5
): AsyncGenerator<R> {
  const pending = new Map<Promise<R>, boolean>();

  for await (const item of items) {
    const promise = processFn(item).then(
      result => { pending.delete(promise); return result; },
      err => { pending.delete(promise); throw err; }
    );

    pending.set(promise, true);

    // Yield results as they complete, maintaining backpressure
    if (pending.size >= concurrency) {
      yield await Promise.race(pending.keys());
    }
  }

  // Drain remaining
  for (const promise of pending.keys()) {
    yield await promise;
  }
}
```

---

## Event to Iterator Conversion

### Using events.on()

```typescript
import { on } from 'node:events';
import { EventEmitter } from 'node:events';

const emitter = new EventEmitter();

// Convert events to async iterable
async function processEvents() {
  const controller = new AbortController();

  let count = 0;

  try {
    for await (const [data] of on(emitter, 'data', { signal: controller.signal })) {
      console.log('Received:', data);
      if (++count >= 10) {
        controller.abort();
      }
    }
  } catch (err) {
    if (err.name !== 'AbortError') throw err;
  }
}
```

### Using events.once()

```typescript
import { once } from 'node:events';
import { EventEmitter } from 'node:events';

const emitter = new EventEmitter();

// Wait for single event
const [result] = await once(emitter, 'ready');

// With timeout using AbortSignal
try {
  const [data] = await once(emitter, 'data', {
    signal: AbortSignal.timeout(5000)
  });
} catch (err) {
  if (err.name === 'TimeoutError') {
    console.log('Timed out waiting for event');
  }
}
```

---

## Timers Promises API

### setTimeout with Value

```typescript
import { setTimeout } from 'node:timers/promises';

// Simple delay
await setTimeout(1000);

// Delay and return value
const result = await setTimeout(500, 'delayed value');
console.log(result); // 'delayed value'
```

### Cancellable Delay

```typescript
import { setTimeout } from 'node:timers/promises';

const controller = new AbortController();

setTimeout(() => controller.abort(), 100);

try {
  await setTimeout(5000, null, { signal: controller.signal });
} catch (err) {
  if (err.name === 'AbortError') {
    console.log('Delay was cancelled');
  }
}
```

### Interval as Async Iterator

```typescript
import { setInterval } from 'node:timers/promises';

const controller = new AbortController();

let count = 0;

for await (const _ of setInterval(1000, null, { signal: controller.signal })) {
  console.log('Tick', ++count);
  if (count >= 5) {
    controller.abort();
  }
}
```

### Scheduler API

```typescript
import { scheduler } from 'node:timers/promises';

// Wait (like setTimeout but semantic)
await scheduler.wait(1000);

// Yield to event loop (like setImmediate)
await scheduler.yield();
```

### Polling Pattern

```typescript
import { setTimeout } from 'node:timers/promises';

async function pollUntilReady<T>(
  checkFn: () => Promise<T | null>,
  intervalMs = 1000,
  maxAttempts = 30
): Promise<T> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const result = await checkFn();
    if (result !== null) {
      return result;
    }
    await setTimeout(intervalMs);
  }

  throw new Error('Polling timed out');
}
```