---
name: rm3-nodejs
description: Writes modern Node.js code using built-in APIs in place of third-party packages. Covers fetch with AbortSignal.timeout/any and retry, streaming responses and SSE, advanced node:test features (module mocking, undici fetch mocking, time mocking, snapshots, dynamic tests), iterators/generators, timers/promises API, worker threads, TypeScript type-level patterns, and modern JS like Promise.withResolvers(), structuredClone(), iterator helpers, Set operations, and using/dispose. Triggers when writing Node.js services or TypeScript backends, replacing nodemon with --watch or Jest/Vitest with node:test, or using those modern JS patterns. Extends the global node skill.
metadata:
  tags: nodejs, typescript, esm, testing, async, streams
---

## Prerequisite

Load the global `node` skill first. It is the authority on native TypeScript execution and type stripping, tsconfig.json, ESM modules, basic async patterns, streams, error handling, environment config, logging, graceful shutdown, and basic `node:test` usage. This skill does not repeat that material; it adds the patterns listed below on top of it.

## When to use

Use this skill when writing Node.js services or TypeScript backends that should use modern built-in APIs instead of third-party packages. Relevant when:
- Writing HTTP clients with fetch, combined abort signals, retry logic, or streamed/SSE responses
- Using advanced `node:test` features: module mocking, fetch mocking with undici, time mocking, snapshot paths, dynamic tests, test setup files
- Working with iterators, generators, async generators, `events.on`/`once`, or `node:timers/promises`
- Using modern JS features like `Promise.withResolvers()`, `structuredClone()`, iterator helpers, Set operations, or `using`/`dispose`
- Offloading CPU work to worker threads
- Applying TypeScript type-level patterns: `satisfies`, discriminated unions, exhaustive checks, type predicates, runtime validation
- Replacing nodemon with `--watch` or Jest/Vitest with `node:test`

## Key concepts

- **Async iteration** — Prefer `for await...of` with async generators for pagination, streaming, and event processing over callback-based patterns.
- **Built-in test runner** — `node:test` provides module mocking, timer mocking, snapshots, and dynamic tests. See [references/testing-patterns.md](references/testing-patterns.md).
- **Abort signals** — Compose `AbortSignal.timeout()` and `AbortSignal.any()` instead of hand-rolled timeouts. See [references/fetch-and-http.md](references/fetch-and-http.md).

## How to use

Read individual files on demand — only open what the current task requires:

**Reference**
- [references/project-setup.md](references/project-setup.md) — package.json dev scripts (--watch, --env-file), top-level await, subpath imports
- [references/fetch-and-http.md](references/fetch-and-http.md) — fetch with AbortSignal.timeout, combining signals, retry with backoff, streaming responses, SSE
- [references/testing-patterns.md](references/testing-patterns.md) — advanced node:test features: test options, assertion planning, module mocking, per-call mock implementations, fetch mocking with undici, time mocking, snapshot paths, dynamic tests, test setup
- [references/async-patterns.md](references/async-patterns.md) — iterators, async iterators, generators, pagination, batch processing, events.on/once, timers promises API
- [references/modern-js-features.md](references/modern-js-features.md) — Promise.withResolvers(), structuredClone(), iterator helpers, Set operations, explicit resource management (using/dispose)
- [references/worker-threads.md](references/worker-threads.md) — worker threads with parentPort/workerData

## CLI flags

Flags not covered by the global `node` skill:

| Flag | Purpose |
|------|---------|
| `--watch` | Restart on file changes (replaces nodemon) |
| `--experimental-test-snapshots` | Enable snapshot testing |
| `--experimental-test-module-mocks` | Enable module mocking |
| `--experimental-transform-types` | Enable enum/namespace support |
