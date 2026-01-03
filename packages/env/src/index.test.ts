import assert from 'node:assert/strict';
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { afterEach, beforeEach, describe, it } from 'node:test';

import { z } from 'zod';

import { createEnv, findWorkspaceRoot, loadEnv } from './index.ts';

/** Snapshot of `process.env`, taken before each test and restored after it. */
let envSnapshot: NodeJS.ProcessEnv;

beforeEach(() => {
  envSnapshot = { ...process.env };
});

afterEach(() => {
  for (const key of Object.keys(process.env)) {
    if (!(key in envSnapshot)) {
      delete process.env[key];
    }
  }
  Object.assign(process.env, envSnapshot);
});

function makeTmpDir(prefix: string): Promise<string> {
  return mkdtemp(path.join(tmpdir(), prefix));
}

describe('createEnv', () => {
  it('returns a frozen object with coerced values', () => {
    process.env.RM3_PORT = '3000';
    process.env.RM3_DEBUG = 'true';

    const env = createEnv({
      schema: {
        RM3_DEBUG: z.coerce.boolean(),
        RM3_HOST: z.string().default('localhost'),
        RM3_PORT: z.coerce.number(),
      },
    });

    assert.equal(env.RM3_PORT, 3000);
    assert.equal(env.RM3_DEBUG, true);
    assert.equal(env.RM3_HOST, 'localhost');
    assert.ok(Object.isFrozen(env));
  });

  it('throws an error listing each failing key', () => {
    delete process.env.RM3_MISSING_A;
    delete process.env.RM3_MISSING_B;

    // try/catch rather than `assert.throws` with a validator: the validator
    // signature is `(thrown: unknown) => boolean`, and a parameter typed
    // `unknown` is exactly what anti-slop rejects. A catch binding narrows in
    // the same two lines and reads the same.
    try {
      createEnv({
        schema: {
          RM3_MISSING_A: z.string(),
          RM3_MISSING_B: z.string(),
        },
      });
    } catch (cause) {
      assert.ok(cause instanceof Error);
      assert.match(cause.message, /Environment validation failed:/);
      assert.match(cause.message, /RM3_MISSING_A/);
      assert.match(cause.message, /RM3_MISSING_B/);
      return;
    }
    assert.fail('createEnv resolved instead of reporting the missing keys');
  });
});

describe('findWorkspaceRoot', () => {
  it('walks up to the directory holding pnpm-workspace.yaml', async () => {
    const root = await makeTmpDir('rm3-env-root-');
    const nested = path.join(root, 'packages', 'app');
    await mkdir(nested, { recursive: true });
    await writeFile(path.join(root, 'pnpm-workspace.yaml'), 'packages:\n');

    assert.equal(findWorkspaceRoot(nested), root);
  });

  it('returns start when there is no workspace root above it', async () => {
    const start = await makeTmpDir('rm3-env-orphan-');

    assert.equal(findWorkspaceRoot(start), start);
  });
});

describe('loadEnv', () => {
  it('reads the root .env without overwriting an already-set variable', async () => {
    const root = await makeTmpDir('rm3-env-load-');
    await writeFile(path.join(root, 'pnpm-workspace.yaml'), 'packages:\n');
    await writeFile(path.join(root, '.env'), 'RM3_FROM_FILE=file\nRM3_PRESET=file\n');

    process.env.RM3_PRESET = 'shell';

    const cwd = process.cwd();
    process.chdir(root);
    try {
      await loadEnv();
    } finally {
      process.chdir(cwd);
    }

    assert.equal(process.env.RM3_FROM_FILE, 'file');
    assert.equal(process.env.RM3_PRESET, 'shell');
  });
});
