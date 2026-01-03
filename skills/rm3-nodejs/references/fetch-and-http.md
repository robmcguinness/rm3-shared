# Fetch API & HTTP Patterns

## Contents
- [Fetch with Timeout](#fetch-with-timeout)
- [Manual AbortController](#manual-abortcontroller)
- [Combining Abort Signals](#combining-abort-signals)
- [Retry with Exponential Backoff](#retry-with-exponential-backoff)
- [Streaming Response Bodies](#streaming-response-bodies)
- [Error Handling Pattern](#error-handling-pattern)

---

## Fetch with Timeout

```typescript
async function fetchJson<T>(url: string, timeoutMs = 5000): Promise<T> {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(timeoutMs)
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}
```

---

## Manual AbortController

```typescript
const controller = new AbortController();
setTimeout(() => controller.abort(), 10000); // Auto-cancel after 10s

try {
  const response = await fetch(url, { signal: controller.signal });
  const data = await response.json();
} catch (err) {
  if (err.name === 'AbortError') console.log('Request cancelled');
}
```

---

## Combining Abort Signals

Use `AbortSignal.any()` to cancel on the first of multiple conditions — a timeout, user cancellation, or upstream abort:

```typescript
function fetchWithCancellation(
  url: string,
  parentSignal: AbortSignal,
  timeoutMs = 5000
) {
  const signal = AbortSignal.any([
    parentSignal,
    AbortSignal.timeout(timeoutMs)
  ]);

  return fetch(url, { signal });
}
```

---

## Retry with Exponential Backoff

```typescript
import { setTimeout } from 'node:timers/promises';

async function fetchWithRetry<T>(
  url: string,
  options: RequestInit & { retries?: number; baseDelayMs?: number } = {}
): Promise<T> {
  const { retries = 3, baseDelayMs = 500, ...fetchOptions } = options;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, fetchOptions);

      if (response.status >= 500 && attempt < retries) {
        // Retry on server errors
        await setTimeout(baseDelayMs * 2 ** attempt);
        continue;
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response.json() as Promise<T>;
    } catch (err) {
      if (attempt === retries) throw err;
      if (err.name === 'AbortError') throw err; // Don't retry aborts

      await setTimeout(baseDelayMs * 2 ** attempt);
    }
  }

  throw new Error('Unreachable');
}
```

---

## Streaming Response Bodies

Process large responses incrementally using `response.body` as a `ReadableStream`:

```typescript
async function streamLines(url: string): AsyncGenerator<string> {
  const response = await fetch(url);
  if (!response.body) throw new Error('No body');

  const decoder = new TextDecoder();
  let buffer = '';

  for await (const chunk of response.body) {
    buffer += decoder.decode(chunk, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop()!; // Keep incomplete line in buffer

    for (const line of lines) {
      yield line;
    }
  }

  if (buffer) yield buffer;
}

// Usage
for await (const line of streamLines('https://example.com/large.csv')) {
  console.log(line);
}
```

### Server-Sent Events (SSE) Pattern

```typescript
async function* streamSSE(url: string, signal?: AbortSignal) {
  const response = await fetch(url, {
    headers: { 'Accept': 'text/event-stream' },
    signal
  });

  for await (const line of streamLines(response)) {
    if (line.startsWith('data: ')) {
      yield JSON.parse(line.slice(6));
    }
  }
}
```

---

## Error Handling Pattern

```typescript
class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode = 500,
    public context: Record<string, unknown> = {}
  ) {
    super(message);
    this.name = 'AppError';
  }
}

throw new AppError('Connection failed', 'DB_ERROR', 503, { host: 'localhost' });
```