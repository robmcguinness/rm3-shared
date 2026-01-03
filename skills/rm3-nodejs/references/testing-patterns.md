# Node.js Test Runner — Advanced Patterns

## Contents
- [Test Options](#test-options)
- [Assertion Planning](#assertion-planning)
- [Module Mocking](#module-mocking)
- [Function Mocking](#function-mocking)
- [Fetch Mocking with Undici](#fetch-mocking-with-undici)
- [Time Mocking](#time-mocking)
- [Snapshot Testing](#snapshot-testing)
- [Dynamic Test Generation](#dynamic-test-generation)
- [Test Setup Organization](#test-setup-organization)

> Basic test structure (describe/test, lifecycle hooks, running tests, test isolation) is covered by the `node-best-practices` skill.

---

## Test Options

```typescript
test('skipped test', { skip: true }, () => {
  // Not executed
});

test('skipped with reason', { skip: 'Not implemented yet' }, () => {});

test('only this test runs', { only: true }, () => {
  // When running with --test-only flag
});

test('concurrent tests', { concurrency: true }, async (t) => {
  await t.test('subtestA', async () => {});
  await t.test('subtestB', async () => {});
});

test('with timeout', { timeout: 5000 }, async () => {
  // Fails if takes longer than 5 seconds
});
```

## Assertion Planning

Use `t.plan(count)` to verify the expected number of assertions run — useful for async code and callbacks where assertions might be skipped silently:

```typescript
test('emits exactly 3 events', (t) => {
  t.plan(3);

  emitter.on('data', (value) => {
    t.assert.ok(value); // Must be called exactly 3 times
  });

  emitter.emit('data', 'a');
  emitter.emit('data', 'b');
  emitter.emit('data', 'c');
});
```

---

## Module Mocking

Module mocking requires `--experimental-test-module-mocks` flag.

### Mock a Module's Export

```typescript
import { test, describe, mock, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

describe('OrderService', () => {
  let mockDb: ReturnType<typeof mock.fn>;
  let OrderService: typeof import('../src/order-service.js').OrderService;

  beforeEach(async () => {
    mockDb = mock.fn();

    // Mock must be set up BEFORE importing the consumer
    mock.module('../src/database.js', {
      namedExports: {
        query: mockDb
      }
    });

    // Dynamic import to get the mocked version
    ({ OrderService } = await import('../src/order-service.js'));
  });

  test('creates order', async () => {
    mockDb.mock.mockImplementation(async () => ({ id: 1 }));

    const order = await OrderService.create({ product: 'widget' });

    assert.strictEqual(mockDb.mock.callCount(), 1);
    assert.strictEqual(order.id, 1);
  });
});
```

### Mock Default Export

```typescript
beforeEach(async () => {
  const mockLogger = {
    info: mock.fn(),
    error: mock.fn()
  };

  mock.module('../src/logger.js', {
    defaultExport: mockLogger
  });

  ({ MyService } = await import('../src/my-service.js'));
});
```

### Preserve Some Exports

```typescript
beforeEach(async () => {
  const originalModule = await import('../src/utils.js')
    .then(({ default: _, ...rest }) => rest);

  mock.module('../src/utils.js', {
    namedExports: {
      ...originalModule, // Keep original exports
      formatDate: mock.fn(() => '2024-01-01') // Override specific one
    }
  });
});
```

---

## Function Mocking

### Basic Function Mock

```typescript
import { test, mock } from 'node:test';
import assert from 'node:assert/strict';

test('function mock', () => {
  const mockFn = mock.fn<(a: number, b: number) => number>();

  mockFn.mock.mockImplementation((a, b) => a + b);

  const result = mockFn(2, 3);

  assert.strictEqual(result, 5);
  assert.strictEqual(mockFn.mock.callCount(), 1);
  assert.deepStrictEqual(mockFn.mock.calls[0].arguments, [2, 3]);
});
```

### Mock Implementation Per Call

```typescript
test('different implementations', () => {
  const mockFn = mock.fn<() => string>();

  mockFn.mock.mockImplementationOnce(() => 'first');
  mockFn.mock.mockImplementationOnce(() => 'second');
  mockFn.mock.mockImplementation(() => 'default');

  assert.strictEqual(mockFn(), 'first');
  assert.strictEqual(mockFn(), 'second');
  assert.strictEqual(mockFn(), 'default');
  assert.strictEqual(mockFn(), 'default');
});
```

### Spying on Object Methods

```typescript
test('spy on method', () => {
  const obj = {
    greet(name: string) {
      return `Hello, ${name}`;
    }
  };

  const spy = mock.method(obj, 'greet');

  const result = obj.greet('World');

  assert.strictEqual(result, 'Hello, World');
  assert.strictEqual(spy.mock.callCount(), 1);
  assert.deepStrictEqual(spy.mock.calls[0].arguments, ['World']);
});
```

---

## Fetch Mocking with Undici

Install undici (ships with Node.js but not exposed): `npm install undici`

```typescript
import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { MockAgent, setGlobalDispatcher, getGlobalDispatcher } from 'undici';

describe('API Client', () => {
  let mockAgent: MockAgent;
  let originalDispatcher: any;

  beforeEach(() => {
    originalDispatcher = getGlobalDispatcher();
    mockAgent = new MockAgent();
    mockAgent.disableNetConnect(); // Fail on unmocked requests
    setGlobalDispatcher(mockAgent);
  });

  afterEach(() => {
    setGlobalDispatcher(originalDispatcher);
  });

  test('GET request', async () => {
    const mockPool = mockAgent.get('https://api.example.com');

    mockPool.intercept({
      path: '/users/1',
      method: 'GET'
    }).reply(200, { id: 1, name: 'Alice' }, {
      headers: { 'content-type': 'application/json' }
    });

    const response = await fetch('https://api.example.com/users/1');
    const data = await response.json();

    assert.strictEqual(response.status, 200);
    assert.strictEqual(data.name, 'Alice');
  });

  test('POST request with body', async () => {
    const mockPool = mockAgent.get('https://api.example.com');

    mockPool.intercept({
      path: '/users',
      method: 'POST',
      body: JSON.stringify({ name: 'Bob' })
    }).reply(201, { id: 2, name: 'Bob' });

    const response = await fetch('https://api.example.com/users', {
      method: 'POST',
      body: JSON.stringify({ name: 'Bob' }),
      headers: { 'content-type': 'application/json' }
    });

    assert.strictEqual(response.status, 201);
  });

  test('error response', async () => {
    const mockPool = mockAgent.get('https://api.example.com');

    mockPool.intercept({
      path: '/users/999',
      method: 'GET'
    }).reply(404, { error: 'Not found' });

    const response = await fetch('https://api.example.com/users/999');

    assert.strictEqual(response.status, 404);
  });
});
```

---

## Time Mocking

### Freeze Time

```typescript
import { test, mock } from 'node:test';
import assert from 'node:assert/strict';

test('time-dependent code', () => {
  const fixedDate = new Date('2024-06-15T10:30:00Z');
  mock.timers.enable({ apis: ['Date'], now: fixedDate });

  const now = new Date();
  assert.strictEqual(now.toISOString(), '2024-06-15T10:30:00.000Z');

  mock.timers.reset();
});
```

### Advance Time

```typescript
test('setTimeout behavior', async () => {
  mock.timers.enable({ apis: ['setTimeout'] });

  let called = false;
  setTimeout(() => { called = true; }, 5000);

  assert.strictEqual(called, false);

  mock.timers.tick(5000);

  assert.strictEqual(called, true);

  mock.timers.reset();
});
```

### Test Debounce/Throttle

```typescript
test('debounced function', () => {
  mock.timers.enable({ apis: ['setTimeout', 'clearTimeout'] });

  const mockFn = mock.fn();
  const debounced = debounce(mockFn, 300);

  debounced();
  debounced();
  debounced();

  assert.strictEqual(mockFn.mock.callCount(), 0);

  mock.timers.tick(300);

  assert.strictEqual(mockFn.mock.callCount(), 1);

  mock.timers.reset();
});
```

---

## Snapshot Testing

Enable with `--experimental-test-snapshots`. Run with `--test-update-snapshots` to update.

### Basic Snapshot

```typescript
import { test, describe } from 'node:test';

describe('Component', () => {
  test('renders correctly', (t) => {
    const output = renderComponent({ title: 'Hello' });

    t.assert.snapshot(output);
  });
});
```

### Custom Snapshot Path

```typescript
// test/setup.ts
import { basename, dirname, join } from 'node:path';
import { snapshot } from 'node:test';

snapshot.setResolveSnapshotPath((testFilePath) => {
  const dir = dirname(testFilePath);
  const base = basename(testFilePath, '.test.ts');
  return join(dir, '__snapshots__', `${base}.snap.cjs`);
});
```

---

## Dynamic Test Generation

Use `t.test()` inside a test function to generate tests dynamically:

```typescript
import { test } from 'node:test';
import assert from 'node:assert/strict';

const testCases = [
  { input: 1, expected: 2 },
  { input: 2, expected: 4 },
  { input: 3, expected: 6 },
];

test('double function', { concurrency: true }, async (t) => {
  for (const { input, expected } of testCases) {
    await t.test(`doubles ${input} to ${expected}`, () => {
      assert.strictEqual(double(input), expected);
    });
  }
});
```

### Load Test Cases from Files

```typescript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';

test('validates all fixtures', { concurrency: true }, async (t) => {
  const fixtures = await readdir('./test/fixtures');

  for (const fixture of fixtures) {
    await t.test(`fixture: ${fixture}`, async () => {
      const content = await readFile(`./test/fixtures/${fixture}`, 'utf8');
      const data = JSON.parse(content);

      assert.ok(validate(data));
    });
  }
});
```

---

## Test Setup Organization

### Base Setup (test/setup.ts)

```typescript
import { register } from 'node:module';

// Register loaders if needed
register('some-loader', import.meta.url);

// Global test configuration
export const TEST_TIMEOUT = 10000;
```

### Integration Test Setup (test/setup.integration.ts)

```typescript
import { before, after } from 'node:test';
import './setup.js';

let testDb: TestDatabase;

before(async () => {
  testDb = await TestDatabase.create();
  globalThis.testDb = testDb;
});

after(async () => {
  await testDb?.destroy();
});
```

### Running Different Test Suites

```bash
# Unit tests only
node --test --test-name-pattern='unit:' 'test/**/*.test.ts'

# Integration tests with setup
node --test --import ./test/setup.integration.ts 'test/integration/**/*.test.ts'

# Watch mode for development
node --test --watch 'test/**/*.test.ts'
```