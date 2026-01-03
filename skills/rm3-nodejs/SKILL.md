---
name: rm3-nodejs
description: Writes modern Node.js code using TypeScript, ESM, and built-in APIs. Covers native TypeScript execution, node:* imports, fetch with AbortController, built-in test runner with mocking/snapshots, timers/promises API, async iterators, worker threads, stream pipelines, explicit resource management (using/dispose), and dev features like --watch and --env-file. Triggers when writing Node.js services, TypeScript backends, or using modern JS patterns like Promise.withResolvers(), structuredClone(), iterator helpers, or using declarations. Also triggers when replacing nodemon with --watch, dotenv with --env-file, Jest/Vitest with node:test, or when asking about running TypeScript without a build step.
metadata:
  tags: nodejs, typescript, esm, testing, async, streams
---

## When to use

Use this skill when writing Node.js services or TypeScript backends that should use modern built-in APIs instead of third-party packages. Relevant when:
- Setting up a new Node.js project with TypeScript (no build step)
- Writing HTTP clients with fetch, AbortController, or retry logic
- Writing tests with node:test instead of Jest/Vitest
- Working with async iterators, generators, or stream pipelines
- Using modern JS features like `Promise.withResolvers()`, `structuredClone()`, iterator helpers, Set operations, or `using`/`dispose`
- Replacing nodemon with `--watch`, dotenv with `--env-file`, or Jest with `node:test`

## Key concepts

- **Native TypeScript** — Node.js v22.18.0+ runs `.ts` files directly if using erasable syntax only (no `enum`, `namespace`). See [references/project-setup.md](references/project-setup.md).
- **Built-in test runner** — `node:test` provides advanced mocking, snapshots, and coverage. See [references/testing-patterns.md](references/testing-patterns.md).
- **Async iteration** — Prefer `for await...of` with async generators for pagination, streaming, and event processing over callback-based patterns.

> This skill complements `node-best-practices`, which covers TypeScript config/type stripping, ESM modules, basic async patterns (Promise.all, p-limit, AbortController), streams, error handling, and more. This skill focuses on **fetch patterns, advanced test runner features, iterators/generators, modern JS features, and timers promises API**.

## How to use

Read individual files on demand — only open what the current task requires:

**Reference**
- [references/project-setup.md](references/project-setup.md) — package.json scripts (--watch, --env-file), native TypeScript execution, top-level await, subpath imports
- [references/fetch-and-http.md](references/fetch-and-http.md) — fetch with timeout/abort, combining signals, retry with backoff, streaming responses, SSE, error handling
- [references/testing-patterns.md](references/testing-patterns.md) — advanced node:test features: module/function mocking, fetch mocking with undici, time mocking, snapshots, dynamic tests, test setup
- [references/async-patterns.md](references/async-patterns.md) — iterators, async iterators, generators, pagination, batch processing, events.on/once, timers promises API
- [references/modern-js-features.md](references/modern-js-features.md) — Promise.withResolvers(), structuredClone(), iterator helpers, Set operations, explicit resource management (using/dispose)
- [references/streams-and-workers.md](references/streams-and-workers.md) — worker threads with parentPort/workerData
- [references/typescript-patterns.md](references/typescript-patterns.md) — unknown vs any, satisfies, discriminated unions, exhaustive checks, as const, type predicates, utility types, runtime validation, strict config

## CLI flags

| Flag | Purpose |
|------|---------|
| `--watch` | Restart on file changes (replaces nodemon) |
| `--env-file=.env` | Load environment variables (replaces dotenv) |
| `--test` | Run test files |
| `--test --watch` | Run tests in watch mode |
| `--experimental-test-coverage` | Generate coverage report |
| `--experimental-test-snapshots` | Enable snapshot testing |
| `--experimental-test-module-mocks` | Enable module mocking |
| `--experimental-transform-types` | Enable enum/namespace support |